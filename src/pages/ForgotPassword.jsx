import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmitEmail = (e) => {
    e.preventDefault();
    setError('');
    setStep(2);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      await resetPassword(email, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-3xl font-display font-bold text-memoir-800">Memoir</h1>
        </div>
        <div className="card p-8">
          <div className="mb-6">
            <Link to="/login" className="flex items-center gap-1 text-sm text-memoir-400 hover:text-memoir-600 transition-colors"><ArrowLeft size={16} /> Back to login</Link>
          </div>
          <h2 className="text-xl font-semibold text-memoir-800 mb-2">Reset Password</h2>
          <p className="text-sm text-memoir-400 mb-6">{step === 1 ? 'Enter your email to reset your password.' : 'Enter your new password.'}</p>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          {success ? <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">Password reset successfully! Redirecting to login...</div> : step === 1 ? (
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-memoir-600 mb-1">Email</label>
                <div className="relative"><Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" required /></div>
              </div>
              <button type="submit" className="btn-primary w-full">Continue</button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div><label className="block text-sm font-medium text-memoir-600 mb-1">New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="••••••••" required /></div>
              <button type="submit" className="btn-primary w-full">Reset Password</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
