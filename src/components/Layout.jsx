import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Star, BookOpen, LogOut, Shield } from 'lucide-react';
import { clearAllUserData } from '../lib/storage';

const navItems = [
  { to: '/', icon: Home, label: 'Chats' },
  { to: '/starred', icon: Star, label: 'Starred' },
  { to: '/scrapbooks', icon: BookOpen, label: 'Scrapbooks' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (user?.id) {
      try { await clearAllUserData(user.id); } catch {}
    }
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 border-b border-memoir-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h1 className="text-xl font-display font-bold text-memoir-800">Memoir</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full ml-2">
              <Shield size={10} /> Privacy RAM
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-memoir-100 text-memoir-700' : 'text-memoir-400 hover:text-memoir-600 hover:bg-memoir-50'}`}>
                <Icon size={18} />{label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-memoir-400 hidden sm:block">{user?.name || user?.email}</span>
            <button onClick={handleLogout} className="p-2 rounded-xl text-memoir-400 hover:text-memoir-600 hover:bg-memoir-50 transition-colors" title="Logout (clears RAM chats for privacy)">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-6">{children}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-memoir-100">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${isActive ? 'text-memoir-600' : 'text-memoir-300'}`}>
              <Icon size={20} /><span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
