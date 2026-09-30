import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, UserCheck, Copy, Check } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const { login, continueAsGuest, locked, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = locked && location.pathname !== '/login' ? location.pathname : '/';

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    const normalizedEmail = String(email || user?.email || '').trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) { setError('Enter a valid email address.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    setSubmitting(true);
    try {
      const result = await login(normalizedEmail, password);
      if (result.recoveryPhrase) setRecoveryPhrase(result.recoveryPhrase);
      else navigate(destination);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (recoveryPhrase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#fdf8f0]">
        <div className="card p-7 w-full max-w-md">
          <div className="text-4xl mb-4">🔑</div>
          <h1 className="text-2xl font-display font-bold text-memoir-800">Save your recovery phrase</h1>
          <p className="text-sm text-memoir-400 mt-2">This is the only way to recover encrypted memories if you forget your password. Keep it somewhere private.</p>
          <div className="my-5 p-4 rounded-xl bg-memoir-50 border border-memoir-200 font-mono text-sm leading-7 select-all break-words">{recoveryPhrase}</div>
          <button onClick={async () => { await navigator.clipboard.writeText(recoveryPhrase); setCopied(true); }} className="btn-secondary w-full flex items-center justify-center gap-2">
            {copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Copied' : 'Copy phrase'}
          </button>
          <button onClick={() => navigate(destination)} className="btn-primary w-full mt-3">I saved it safely</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fdf8f0]">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">📖</div>
          <h1 className="text-3xl font-display font-bold text-memoir-800">{locked ? 'Unlock Memoir' : 'Welcome back'}</h1>
          <p className="text-memoir-400 mt-2">{locked ? 'Enter your password to decrypt your memories.' : 'Sign in to your encrypted collection.'}</p>
        </div>
        <div className="card p-7">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {!locked && (
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-memoir-600 mb-1">Email</label>
                <div className="relative"><Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input id="login-email" type="email" value={email} onChange={event => setEmail(event.target.value)} className="input-field pl-10" autoComplete="email" aria-invalid={Boolean(error)} /></div>
              </div>
            )}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-memoir-600 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" />
                <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} className="input-field pl-10 pr-10" autoComplete="current-password" aria-invalid={Boolean(error)} autoFocus={locked} />
                <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-memoir-300" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting ? 'Unlocking...' : locked ? 'Unlock' : 'Sign In'}</button>
          </form>
          <div className="mt-5 text-center space-y-3">
            <Link to="/forgot-password" className="block text-sm text-memoir-500">Forgot password?</Link>
            {!locked && <p className="text-sm text-memoir-400">New here? <Link to="/register" className="text-memoir-700 font-medium">Create account</Link></p>}
            <button onClick={async () => { await continueAsGuest(); navigate('/'); }} className="text-sm text-memoir-400 inline-flex items-center gap-1.5"><UserCheck size={15} />Continue as Guest</button>
          </div>
        </div>
      </div>
    </div>
  );
}
