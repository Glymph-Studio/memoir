import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, User, Shield, UserCheck } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-3xl font-display font-bold text-memoir-800">Memoir</h1>
          <p className="text-memoir-400 mt-2">Free to use • Login optional</p>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-memoir-800 mb-2">Create account (optional)</h2>
          <p className="text-sm text-memoir-400 mb-4">You can use Memoir without account. Create one only to save scrapbooks across sessions.</p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 flex gap-2">
            <Shield size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-emerald-800">Security & Privacy</p>
              <p className="text-[11px] text-emerald-700 mt-1">
                • Passwords hashed with SHA-256 + random salt, stored locally in IndexedDB.<br/>
                • Old plaintext vulnerability fixed.<br/>
                • Chats never saved, only RAM.<br/>
                • Guest scrapbooks auto-migrate to your new account.
              </p>
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-memoir-600 mb-1">Full Name</label>
              <div className="relative"><User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field pl-10" placeholder="Your name" required /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-memoir-600 mb-1">Email</label>
              <div className="relative"><Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" required /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-memoir-600 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pl-10 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-memoir-300 hover:text-memoir-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              <p className="text-[11px] text-memoir-300 mt-1">Hashed locally, never sent to server</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-memoir-600 mb-1">Confirm Password</label>
              <div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field pl-10" placeholder="••••••••" required /></div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account & Migrate Guest'}</button>
          </form>

          <div className="mt-4">
            <button onClick={async () => { await continueAsGuest(); navigate('/'); }} className="btn-secondary w-full flex items-center justify-center gap-2"><UserCheck size={18} />Skip, Continue as Guest</button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-memoir-400">Already have an account? <Link to="/login" className="text-memoir-600 font-medium hover:text-memoir-800">Sign in</Link></p>
            <Link to="/" className="block text-sm text-memoir-400 hover:text-memoir-600 mt-2">← Use without login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
