import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Shield, UserCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    await continueAsGuest();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-3xl font-display font-bold text-memoir-800">Memoir</h1>
          <p className="text-memoir-400 mt-2">Welcome back</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-memoir-800 mb-2">Save your work</h2>
          <p className="text-sm text-memoir-400 mb-4">Sign in to continue with your saved scrapbooks.</p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>

          <div className="mt-4">
            <button onClick={handleGuest} className="btn-secondary w-full flex items-center justify-center gap-2"><UserCheck size={18} />Continue as Guest</button>
          </div>

          <div className="mt-6 text-center space-y-2">
            <Link to="/forgot-password" className="text-sm text-memoir-400 hover:text-memoir-600 transition-colors">Forgot password?</Link>
            <p className="text-sm text-memoir-400">Don't have an account? <Link to="/register" className="text-memoir-600 font-medium hover:text-memoir-800 transition-colors">Sign up</Link></p>
            <Link to="/" className="block text-sm text-memoir-400 hover:text-memoir-600 mt-2">Back to Memoir</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
