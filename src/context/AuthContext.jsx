import { createContext, useContext, useEffect, useState } from 'react';
import {
  decrypt, deriveKey, encrypt, generateDataKey, generateGuestId, generateRecoveryPhrase,
  generateSalt, importDataKey, normalizeRecoveryPhrase, sanitizeInput,
} from '../lib/crypto';
import { requireSupabase, supabase } from '../lib/supabase';
import { configureStorage, lockStorage, clearAllUserData } from '../lib/storage';

const AuthContext = createContext(null);
const emptyVault = () => ({ version: 1, chats: [], messages: {}, starred: [], scrapbooks: [], updatedAt: new Date().toISOString() });

function makeGuest() {
  return { id: generateGuestId(), email: '', name: 'Guest', isGuest: true };
}

function appUser(authUser) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    isGuest: false,
  };
}

async function createWrappedKeys(password, recoveryPhrase = generateRecoveryPhrase()) {
  const salt = generateSalt();
  const recoverySalt = generateSalt();
  const { key: dataKey, encoded: rawDataKey } = await generateDataKey();
  const passwordKey = await deriveKey(password, salt);
  const recoveryKey = await deriveKey(normalizeRecoveryPhrase(recoveryPhrase), recoverySalt);
  return {
    salt,
    recoverySalt,
    recoveryPhrase,
    dataKey,
    wrappedKey: await encrypt(passwordKey, rawDataKey),
    recoveryBlob: await encrypt(recoveryKey, rawDataKey),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cryptoKey, setCryptoKey] = useState(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const boot = async () => {
      const client = supabase;
      const session = client ? (await client.auth.getSession()).data.session : null;
      if (!active) return;
      if (session?.user) {
        lockStorage();
        setUser(appUser(session.user));
        setLocked(true);
      } else {
        const guest = makeGuest();
        await configureStorage(guest.id, null);
        if (!active) return;
        setUser(guest);
      }
      setLoading(false);
    };
    boot().catch(() => {
      if (active) {
        const guest = makeGuest();
        configureStorage(guest.id, null).finally(() => { setUser(guest); setLoading(false); });
      }
    });
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const client = requireSupabase();
    const { data: authData, error: authError } = await client.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    const authUser = authData.user;
    const { data: row, error: rowError } = await client.from('user_data').select('*').eq('user_id', authUser.id).maybeSingle();
    if (rowError) throw rowError;

    let dataKey;
    let salt;
    let recoveryPhrase = null;

    if (row?.wrapped_key) {
      salt = row.salt;
      const passwordKey = await deriveKey(password, salt);
      try {
        dataKey = await importDataKey(await decrypt(passwordKey, row.wrapped_key));
      } catch {
        throw new Error('Your encryption password could not unlock this account.');
      }
    } else if (row?.encrypted_blob && row?.salt) {
      // One-time migration from the original password-derived encryption format.
      const legacyKey = await deriveKey(password, row.salt);
      let plaintext;
      try { plaintext = await decrypt(legacyKey, row.encrypted_blob); }
      catch { throw new Error('Your encryption password could not unlock existing data.'); }
      const wrapped = await createWrappedKeys(password);
      dataKey = wrapped.dataKey;
      salt = wrapped.salt;
      recoveryPhrase = wrapped.recoveryPhrase;
      const { error } = await client.from('user_data').update({
        salt,
        wrapped_key: wrapped.wrappedKey,
        recovery_salt: wrapped.recoverySalt,
        recovery_blob: wrapped.recoveryBlob,
        encrypted_blob: await encrypt(dataKey, plaintext),
      }).eq('user_id', authUser.id);
      if (error) throw error;
    } else {
      // Confirmed accounts that did not yet get an encrypted data row.
      const wrapped = await createWrappedKeys(password);
      dataKey = wrapped.dataKey;
      salt = wrapped.salt;
      recoveryPhrase = wrapped.recoveryPhrase;
      const { error } = await client.from('user_data').upsert({
        user_id: authUser.id,
        salt,
        wrapped_key: wrapped.wrappedKey,
        recovery_salt: wrapped.recoverySalt,
        recovery_blob: wrapped.recoveryBlob,
        encrypted_blob: await encrypt(dataKey, JSON.stringify(emptyVault())),
      }, { onConflict: 'user_id' });
      if (error) throw error;
    }

    await configureStorage(authUser.id, dataKey, salt);
    const nextUser = appUser(authUser);
    setCryptoKey(dataKey);
    setUser(nextUser);
    setLocked(false);
    return { user: nextUser, recoveryPhrase };
  };

  const register = async (name, email, password) => {
    const client = requireSupabase();
    const cleanName = sanitizeInput(name);
    if (cleanName.length < 2) throw new Error('Name must have at least 2 characters');
    if (password.length < 10) throw new Error('Use at least 10 characters for your password');

    const wrapped = await createWrappedKeys(password);
    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: { data: { name: cleanName } },
    });
    if (authError) throw authError;
    if (!authData.session) throw new Error('Check your email to confirm the account, then sign in. Your recovery phrase will be created at first sign in.');

    const { error } = await client.from('user_data').insert({
      user_id: authData.user.id,
      salt: wrapped.salt,
      wrapped_key: wrapped.wrappedKey,
      recovery_salt: wrapped.recoverySalt,
      recovery_blob: wrapped.recoveryBlob,
      encrypted_blob: await encrypt(wrapped.dataKey, JSON.stringify(emptyVault())),
    });
    if (error) throw error;

    await configureStorage(authData.user.id, wrapped.dataKey, wrapped.salt);
    const nextUser = { id: authData.user.id, email, name: cleanName, isGuest: false };
    setCryptoKey(wrapped.dataKey);
    setUser(nextUser);
    setLocked(false);
    return { user: nextUser, recoveryPhrase: wrapped.recoveryPhrase };
  };

  const requestPasswordReset = async email => {
    const client = requireSupabase();
    const redirectTo = `${window.location.origin}/forgot-password`;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  };

  const recoverWithPhrase = async (phrase, newPassword) => {
    const client = requireSupabase();
    const { data: sessionData } = await client.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) throw new Error('Open the recovery link from your email first.');
    const { data: row, error: readError } = await client.from('user_data').select('*').eq('user_id', authUser.id).single();
    if (readError) throw readError;
    if (!row.recovery_blob || !row.recovery_salt) throw new Error('This account does not have a recovery phrase yet. Sign in with the original password.');

    const recoveryKey = await deriveKey(normalizeRecoveryPhrase(phrase), row.recovery_salt);
    let rawDataKey;
    try { rawDataKey = await decrypt(recoveryKey, row.recovery_blob); }
    catch { throw new Error('Recovery phrase is incorrect.'); }

    const newSalt = generateSalt();
    const passwordKey = await deriveKey(newPassword, newSalt);
    const wrappedKey = await encrypt(passwordKey, rawDataKey);
    const { error: passwordError } = await client.auth.updateUser({ password: newPassword });
    if (passwordError) throw passwordError;
    const { error: updateError } = await client.from('user_data').update({ salt: newSalt, wrapped_key: wrappedKey }).eq('user_id', authUser.id);
    if (updateError) throw updateError;

    const dataKey = await importDataKey(rawDataKey);
    await configureStorage(authUser.id, dataKey, newSalt);
    setCryptoKey(dataKey);
    setUser(appUser(authUser));
    setLocked(false);
  };

  const logout = async () => {
    const previousId = user?.id;
    setCryptoKey(null);
    setLocked(false);
    lockStorage();
    if (previousId) await clearAllUserData(previousId);
    if (supabase) await supabase.auth.signOut();
    const guest = makeGuest();
    await configureStorage(guest.id, null);
    setUser(guest);
  };

  const continueAsGuest = async () => {
    setCryptoKey(null);
    setLocked(false);
    lockStorage();
    if (supabase) await supabase.auth.signOut();
    const guest = makeGuest();
    await configureStorage(guest.id, null);
    setUser(guest);
    return guest;
  };

  return (
    <AuthContext.Provider value={{ user, cryptoKey, locked, login, register, logout, continueAsGuest, requestPasswordReset, recoverWithPhrase, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
