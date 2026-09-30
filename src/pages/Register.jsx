import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, User, UserCheck, Copy, Check } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const { register, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const result = await register(name, email, password);
      setRecoveryPhrase(result.recoveryPhrase);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (recoveryPhrase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#fdf8f0]">
        <div className="card p-7 w-full max-w-md">
          <div className="text-4xl mb-4">🔑</div>
          <h1 className="text-2xl font-display font-bold text-memoir-800">Save your recovery phrase</h1>
          <p className="text-sm text-memoir-400 mt-2">You will need this phrase if you forget your password. It cannot be recovered for you.</p>
          <div className="my-5 p-4 rounded-xl bg-memoir-50 border border-memoir-200 font-mono text-sm leading-7 select-all break-words">{recoveryPhrase}</div>
          <button onClick={async () => { await navigator.clipboard.writeText(recoveryPhrase); setCopied(true); }} className="btn-secondary w-full flex items-center justify-center gap-2">{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Copied' : 'Copy phrase'}</button>
          <button onClick={() => navigate('/')} className="btn-primary w-full mt-3">I saved it safely</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-3xl font-display font-bold text-memoir-800">Memoir</h1>
          <p className="text-memoir-400 mt-2">Create your account</p>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-memoir-800 mb-2">Create account (optional)</h2>
          <p className="text-sm text-memoir-400 mb-4">Create an account to keep your scrapbooks together.</p>

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
            </div>
            <div>
              <label className="block text-sm font-medium text-memoir-600 mb-1">Confirm Password</label>
              <div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field pl-10" placeholder="••••••••" required /></div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
          </form>

          <div className="mt-4">
            <button onClick={async () => { await continueAsGuest(); navigate('/'); }} className="btn-secondary w-full flex items-center justify-center gap-2"><UserCheck size={18} />Continue as Guest</button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-memoir-400">Already have an account? <Link to="/login" className="text-memoir-600 font-medium hover:text-memoir-800">Sign in</Link></p>
            <Link to="/" className="block text-sm text-memoir-400 hover:text-memoir-600 mt-2">Back to Memoir</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
