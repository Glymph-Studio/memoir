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
  const [consent, setConsent] = useState(false);
  const { register, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (name.trim().length < 2) { setError('Enter your name.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) { setError('Enter a valid email address.'); return; }
    if (password.length < 10) { setError('Use at least 10 characters for your password.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!consent) { setError('Confirm that you are 18 or older and agree to the Terms and Privacy Policy.'); return; }
    setLoading(true);
    try {
      const result = await register(name.trim(), normalizedEmail, password);
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
          <h2 className="text-xl font-semibold text-memoir-800 mb-2">Keep your memories together</h2>
          <p className="text-sm text-memoir-400 mb-4">Sync your encrypted scrapbooks across sessions.</p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-memoir-600 mb-1">Full Name</label>
              <div className="relative"><User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input id="register-name" type="text" value={name} onChange={e => setName(e.target.value)} className="input-field pl-10" placeholder="Your name" /></div>
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-memoir-600 mb-1">Email</label>
              <div className="relative"><Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input id="register-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" /></div>
            </div>
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-memoir-600 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" />
                <input id="register-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pl-10 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-memoir-300 hover:text-memoir-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div>
              <label htmlFor="register-confirm" className="block text-sm font-medium text-memoir-600 mb-1">Confirm Password</label>
              <div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input id="register-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field pl-10" placeholder="••••••••" /></div>
            </div>
            <label className="flex items-start gap-3 text-sm text-memoir-600 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-memoir-600" aria-describedby="account-consent" />
              <span id="account-consent">I am 18 or older and agree to the <Link to="/terms" className="underline font-medium">Terms and Conditions</Link> and acknowledge the <Link to="/privacy" className="underline font-medium">Privacy Policy</Link>, including processing my account details and encrypted content to provide Memoir.</span>
            </label>
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
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
