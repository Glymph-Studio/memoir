import { createContext, useContext, useEffect, useState } from 'react';
import { deriveKey, generateGuestId, generateSalt, encrypt, sanitizeInput } from '../lib/crypto';
import { requireSupabase, supabase } from '../lib/supabase';
import { configureStorage, lockStorage, clearAllUserData } from '../lib/storage';

const AuthContext = createContext(null);
const emptyVault = JSON.stringify({ version: 1, chats: [], messages: {}, starred: [], scrapbooks: [], updatedAt: new Date().toISOString() });

function makeGuest() {
  return { id: generateGuestId(), email: '', name: 'Guest', isGuest: true };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cryptoKey, setCryptoKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const boot = async () => {
      // The AES key is intentionally not restored from browser storage.
      // A remembered Supabase session still requires the encryption password again.
      const guest = makeGuest();
      await configureStorage(guest.id, null);
      if (active) {
        setUser(guest);
        setLoading(false);
      }
    };
    boot();
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const client = requireSupabase();
    const { data: authData, error: authError } = await client.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    const authUser = authData.user;

    const { data: row, error: rowError } = await client
      .from('user_data')
      .select('salt')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (rowError) throw rowError;

    const salt = row?.salt || authUser.user_metadata?.encryption_salt;
    if (!salt) throw new Error('Encryption salt is missing. This account cannot be decrypted.');
    const key = await deriveKey(password, salt);

    if (!row) {
      const encryptedBlob = await encrypt(key, emptyVault);
      const { error } = await client.from('user_data').insert({ user_id: authUser.id, salt, encrypted_blob: encryptedBlob });
      if (error) throw error;
    }

    try {
      await configureStorage(authUser.id, key);
    } catch (error) {
      await client.auth.signOut();
      throw new Error('Could not decrypt your data. Check your password or encryption setup.');
    }

    const appUser = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      isGuest: false,
    };
    setCryptoKey(key);
    setUser(appUser);
    return appUser;
  };

  const register = async (name, email, password) => {
    const client = requireSupabase();
    const cleanName = sanitizeInput(name);
    if (cleanName.length < 2) throw new Error('Name must have at least 2 characters');
    if (password.length < 8) throw new Error('Password must have at least 8 characters');

    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: { data: { name: cleanName, encryption_salt: salt } },
    });
    if (authError) throw authError;
    if (!authData.session) {
      throw new Error('Check your email to confirm the account, then sign in.');
    }

    const encryptedBlob = await encrypt(key, emptyVault);
    const { error: insertError } = await client.from('user_data').insert({
      user_id: authData.user.id,
      salt,
      encrypted_blob: encryptedBlob,
    });
    if (insertError) throw insertError;

    await configureStorage(authData.user.id, key);
    const appUser = { id: authData.user.id, email, name: cleanName, isGuest: false };
    setCryptoKey(key);
    setUser(appUser);
    return appUser;
  };

  const logout = async () => {
    const previousId = user?.id;
    setCryptoKey(null);
    lockStorage();
    if (previousId) await clearAllUserData(previousId);
    if (supabase) await supabase.auth.signOut();
    const guest = makeGuest();
    await configureStorage(guest.id, null);
    setUser(guest);
  };

  const resetPassword = async () => {
    throw new Error('Encrypted data cannot be recovered by changing only the account password. Recovery phrase support is required.');
  };

  const continueAsGuest = async () => {
    setCryptoKey(null);
    lockStorage();
    const guest = makeGuest();
    await configureStorage(guest.id, null);
    setUser(guest);
    return guest;
  };

  return (
    <AuthContext.Provider value={{ user, cryptoKey, login, register, logout, resetPassword, continueAsGuest, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
