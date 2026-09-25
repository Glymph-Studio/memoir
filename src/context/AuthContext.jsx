import { createContext, useContext, useState, useEffect } from 'react';
import {
  getUsers, saveUsers, getCurrentUser, setCurrentUser, clearCurrentUser,
  getUsersSync, getCurrentUserSync, saveUsersSync, setCurrentUserSync, clearCurrentUserSync,
  generateId, getScrapbooks, saveScrapbooks
} from '../lib/storage';
import { hashPassword, verifyPassword, generateGuestId, sanitizeInput } from '../lib/crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Fast sync boot
      const saved = getCurrentUserSync();
      if (saved) {
        setUser(saved);
        setLoading(false);
        return;
      }
      // Check async IDB
      try {
        const asyncUser = await getCurrentUser();
        if (asyncUser) {
          setUser(asyncUser);
          setCurrentUserSync(asyncUser);
          setLoading(false);
          return;
        }
      } catch {}

      // No user -> create guest (free use, no login required)
      const guest = {
        id: generateGuestId(),
        email: 'guest@local',
        name: 'Guest',
        isGuest: true,
        createdAt: new Date().toISOString(),
      };
      try {
        await setCurrentUser(guest);
        setCurrentUserSync(guest);
      } catch {}
      setUser(guest);
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const users = await getUsers();
    const found = users.find(u => u.email === email);
    if (!found) throw new Error('Invalid email or password');

    // Handle old plaintext passwords (migration)
    if (found.password && !found.passwordHash) {
      if (found.password !== password) throw new Error('Invalid email or password');
      // Migrate to hashed
      const { hash, salt } = await hashPassword(password);
      found.passwordHash = hash;
      found.salt = salt;
      delete found.password; // Remove plaintext
      await saveUsers(users);
      saveUsersSync(users);
    } else {
      // Verify hashed
      const valid = await verifyPassword(password, found.passwordHash, found.salt);
      if (!valid) throw new Error('Invalid email or password');
    }

    // Migrate guest scrapbooks to this user if guest existed
    const current = getCurrentUserSync();
    if (current?.isGuest) {
      try {
        const guestBooks = await getScrapbooks(current.id);
        if (guestBooks.length > 0) {
          const existingBooks = await getScrapbooks(found.id);
          const merged = [...guestBooks, ...existingBooks];
          await saveScrapbooks(found.id, merged);
          console.log(`[Auth] Migrated ${guestBooks.length} scrapbooks from guest to ${found.id}`);
        }
      } catch (e) { console.warn('Guest migration failed', e); }
    }

    const userData = { id: found.id, email: found.email, name: found.name, isGuest: false };
    await setCurrentUser(userData);
    setCurrentUserSync(userData);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const cleanName = sanitizeInput(name);
    if (cleanName.length < 2) throw new Error('Name too short');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');

    const users = await getUsers();
    if (users.find(u => u.email === email)) throw new Error('Email already registered');

    const { hash, salt } = await hashPassword(password);
    const newUser = { 
      id: generateId(), 
      name: cleanName, 
      email, 
      passwordHash: hash, 
      salt,
      createdAt: new Date().toISOString()
    };
    const updated = [...users, newUser];
    await saveUsers(updated);
    saveUsersSync(updated);

    // Migrate guest scrapbooks
    const current = getCurrentUserSync();
    if (current?.isGuest) {
      try {
        const guestBooks = await getScrapbooks(current.id);
        if (guestBooks.length > 0) {
          await saveScrapbooks(newUser.id, guestBooks);
        }
      } catch {}
    }

    const userData = { id: newUser.id, email: newUser.email, name: newUser.name, isGuest: false };
    await setCurrentUser(userData);
    setCurrentUserSync(userData);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    // For guest, just create new guest (don't clear scrapbooks)
    // For real user, clear current but keep users DB
    const current = getCurrentUserSync();
    if (current?.isGuest) {
      // Guest logout = new guest
      const newGuest = {
        id: generateGuestId(),
        email: 'guest@local',
        name: 'Guest',
        isGuest: true,
        createdAt: new Date().toISOString(),
      };
      await setCurrentUser(newGuest);
      setCurrentUserSync(newGuest);
      setUser(newGuest);
    } else {
      await clearCurrentUser();
      clearCurrentUserSync();
      // Auto-create guest after logout so app still usable
      const guest = {
        id: generateGuestId(),
        email: 'guest@local',
        name: 'Guest',
        isGuest: true,
        createdAt: new Date().toISOString(),
      };
      await setCurrentUser(guest);
      setCurrentUserSync(guest);
      setUser(guest);
    }
  };

  const resetPassword = async (email, newPassword) => {
    if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');
    const users = await getUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) throw new Error('Email not found');
    const { hash, salt } = await hashPassword(newPassword);
    users[idx].passwordHash = hash;
    users[idx].salt = salt;
    delete users[idx].password;
    await saveUsers(users);
    saveUsersSync(users);
  };

  const continueAsGuest = async () => {
    const guest = {
      id: generateGuestId(),
      email: 'guest@local',
      name: 'Guest',
      isGuest: true,
      createdAt: new Date().toISOString(),
    };
    await setCurrentUser(guest);
    setCurrentUserSync(guest);
    setUser(guest);
    return guest;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
