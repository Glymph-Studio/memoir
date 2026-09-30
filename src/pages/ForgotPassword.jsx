import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [phrase, setPhrase] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { requestPasswordReset, recoverWithPhrase } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    supabase?.auth.getSession().then(({ data }) => {
      if (active && data.session && (window.location.hash || window.location.search)) setRecoveryMode(true);
    });
    const { data: listener } = supabase?.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
    }) || { data: null };
    return () => { active = false; listener?.subscription?.unsubscribe(); };
  }, []);

  const sendEmail = async event => {
    event.preventDefault();
    setBusy(true); setError('');
    try { await requestPasswordReset(email); setSent(true); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const finishRecovery = async event => {
    event.preventDefault();
    if (newPassword.length < 10) { setError('Use at least 10 characters for your new password.'); return; }
    setBusy(true); setError('');
    try { await recoverWithPhrase(phrase, newPassword); navigate('/'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fdf8f0]">
      <div className="card p-7 w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-memoir-400 mb-6"><ArrowLeft size={16} />Back</Link>
        <div className="text-4xl mb-3">🔑</div>
        <h1 className="text-2xl font-display font-bold text-memoir-800">Recover your memories</h1>
        <p className="text-sm text-memoir-400 mt-2 mb-6">{recoveryMode ? 'Use the recovery phrase you saved when encryption was set up.' : 'We will email you a secure recovery link.'}</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

        {recoveryMode ? (
          <form onSubmit={finishRecovery} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-memoir-600 mb-1">Recovery phrase</label>
              <div className="relative"><KeyRound size={18} className="absolute left-3 top-3 text-memoir-300" /><textarea value={phrase} onChange={event => setPhrase(event.target.value)} className="input-field pl-10 min-h-24 resize-none" autoComplete="off" required /></div>
            </div>
            <div><label className="block text-sm font-medium text-memoir-600 mb-1">New password</label><input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="input-field" autoComplete="new-password" required /></div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Recovering...' : 'Recover and unlock'}</button>
          </form>
        ) : sent ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">Check your email and open the recovery link on this device.</div>
        ) : (
          <form onSubmit={sendEmail} className="space-y-4">
            <div><label className="block text-sm font-medium text-memoir-600 mb-1">Email</label><div className="relative"><Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" /><input type="email" value={email} onChange={event => setEmail(event.target.value)} className="input-field pl-10" autoComplete="email" required /></div></div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending...' : 'Send recovery link'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
