import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Search, Trash2, Shield, BookOpen, Star, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChats, saveChats, saveMessages, generateId, getStorageStats } from '../lib/storage';
import { processChatFile, determineMyMessages } from '../lib/whatsapp-parser';
import { getAvatarColor, getAvatarLetter, truncate, cx } from '../lib/utils';
import PrivacyBanner from '../components/PrivacyBanner';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [chats, setChats] = useState([]);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const c = await getChats(user.id);
      if (mounted) setChats(c);
      const s = await getStorageStats();
      if (mounted) setStats(s);
    })();
    return () => { mounted = false; };
  }, [user.id]);

  const filteredChats = chats.filter(c => c.contactName.toLowerCase().includes(search.toLowerCase()));

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setError('File too large (max 100MB). Try a smaller export.');
      return;
    }
    setImporting(true);
    setError('');
    setProgress(0);
    try {
      const result = await processChatFile(file, (p) => setProgress(p));
      const messages = determineMyMessages(result.messages, result.contactName);
      if (messages.length === 0) throw new Error('No messages found. Check file format - must be WhatsApp .txt export.');

      const chatId = generateId();
      const newChat = {
        id: chatId,
        contactName: result.contactName,
        lastMessage: messages.length > 0 ? truncate(messages[messages.length - 1].content, 40) : '',
        messageCount: messages.length,
        avatarLetter: getAvatarLetter(result.contactName),
        avatarColor: getAvatarColor(result.contactName),
        createdAt: new Date().toISOString(),
        participants: result.participants,
        hasMedia: Object.keys(result.mediaFiles || {}).length > 0,
        mediaCount: Object.keys(result.mediaFiles || {}).length,
      };

      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      await saveChats(user.id, updatedChats);
      await saveMessages(user.id, chatId, messages);
      setProgress(100);
      setTimeout(() => navigate(`/chat/${chatId}`), 300);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setImporting(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteChat = async (chatId) => {
    const updated = chats.filter(c => c.id !== chatId);
    setChats(updated);
    await saveChats(user.id, updated);
  };

  const createDemoChat = async () => {
    const demoMessages = [
      { id: generateId(), sender: 'You', content: 'Remember our trip to Goa? 🌊', timestamp: '12/05/23, 10:30 pm', isMine: true, isMedia: false },
      { id: generateId(), sender: 'Priya', content: 'Of course! Best sunset ever 🌅', timestamp: '12/05/23, 10:31 pm', isMine: false, isMedia: false },
      { id: generateId(), sender: 'You', content: 'I still have that polaroid', timestamp: '12/05/23, 10:32 pm', isMine: true, isMedia: false },
      { id: generateId(), sender: 'Priya', content: 'We should make a scrapbook! 📖', timestamp: '12/05/23, 10:33 pm', isMine: false, isMedia: false },
      { id: generateId(), sender: 'You', content: 'Already on it 😉', timestamp: '12/05/23, 10:34 pm', isMine: true, isMedia: false },
    ];
    const chatId = generateId();
    const newChat = {
      id: chatId,
      contactName: 'Demo Chat (Priya)',
      lastMessage: 'Already on it 😉',
      messageCount: demoMessages.length,
      avatarLetter: 'D',
      avatarColor: 'bg-violet-400',
      createdAt: new Date().toISOString(),
      participants: ['You', 'Priya'],
      hasMedia: false,
      mediaCount: 0,
      isDemo: true,
    };
    const updated = [newChat, ...chats];
    setChats(updated);
    await saveChats(user.id, updated);
    await saveMessages(user.id, chatId, demoMessages);
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="page-container">
      <PrivacyBanner />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-memoir-800 flex items-center gap-2">Your Chats {user?.isGuest && <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">Guest • Free</span>}</h1>
          <p className="text-memoir-400 text-sm mt-1 flex items-center gap-1.5"><Shield size={12} className="text-emerald-500" /> Memory-only • Privacy-safe • Disappears on refresh • No login needed</p>
        </div>
        {stats && <div className="hidden sm:block text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">🔒 RAM • {stats.lsSizeKB}KB • 0 vuln</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-memoir-100 flex gap-3"><div className="w-8 h-8 bg-memoir-100 rounded-full flex items-center justify-center shrink-0"><Upload size={14} className="text-memoir-600" /></div><div><p className="text-xs font-semibold text-memoir-800">1. Import (optional)</p><p className="text-[11px] text-memoir-400 mt-0.5">WhatsApp .txt/.zip, RAM only, 12+ date formats, star images too</p></div></div>
        <div className="bg-white rounded-xl p-3 border border-memoir-100 flex gap-3"><div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center shrink-0"><Star size={14} className="text-amber-500" /></div><div><p className="text-xs font-semibold text-memoir-800">2. Star texts & images</p><p className="text-[11px] text-memoir-400 mt-0.5">Star any message or photo → converts to dataURL for scrapbook (with consent)</p></div></div>
        <div className="bg-white rounded-xl p-3 border border-memoir-100 flex gap-3"><div className="w-8 h-8 bg-violet-50 rounded-full flex items-center justify-center shrink-0"><BookOpen size={14} className="text-violet-500" /></div><div><p className="text-xs font-semibold text-memoir-800">3. Create scrapbook</p><p className="text-[11px] text-memoir-400 mt-0.5">Free, no login, 60fps canvas, export PNG</p></div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats in RAM..." className="input-field pl-10" />
        </div>
        <input type="file" accept=".txt,.zip" onChange={handleImport} ref={fileRef} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="btn-primary flex items-center justify-center gap-2 min-w-[140px]" disabled={importing}><Upload size={18} />{importing ? `${progress}%` : 'Import Chat'}</button>
        <button onClick={createDemoChat} className="btn-secondary flex items-center justify-center gap-2"><Sparkles size={16} />Try Demo</button>
        <button onClick={() => navigate('/scrapbooks')} className="btn-secondary flex items-center justify-center gap-2"><BookOpen size={16} />Scrapbooks</button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      {importing && (
        <div className="mb-4 p-4 card">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin w-5 h-5 border-2 border-memoir-200 border-t-memoir-500 rounded-full" />
            <div className="flex-1"><p className="text-sm font-medium text-memoir-700">Parsing in RAM (never saved to disk)...</p><p className="text-xs text-memoir-400">Images starrable → dataURL with consent</p></div>
            <span className="text-sm font-mono text-memoir-500">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-memoir-100 rounded-full overflow-hidden"><div className="h-full bg-memoir-500 transition-all duration-200" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {filteredChats.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-memoir-600 mb-2">{chats.length === 0 ? 'No chats in memory (free mode)' : 'No matching chats'}</h3>
          <p className="text-memoir-400 text-sm mb-2 max-w-md mx-auto">{chats.length === 0 ? 'Use Memoir for free without login. Import WhatsApp or try demo. Chats live only in RAM for privacy and vanish on refresh. Scrapbooks saved locally.' : 'Try different search'}</p>
          <p className="text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-full mb-2">🔒 Privacy: no chat ever touches disk or cloud • 0 vulnerabilities</p>
          <p className="text-xs text-memoir-300 mb-6">Login details (if you create account) stored locally in IndexedDB as SHA-256 hash, never on server</p>
          {chats.length === 0 && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button onClick={() => fileRef.current?.click()} className="btn-primary"><Upload size={18} className="inline mr-2" />Import Chat</button>
              <button onClick={createDemoChat} className="btn-secondary"><Sparkles size={18} className="inline mr-2" />Try Demo Chat</button>
              <button onClick={() => navigate('/scrapbooks')} className="btn-secondary"><BookOpen size={18} className="inline mr-2" />Go to Scrapbooks (no import needed)</button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChats.map((chat, i) => (
            <motion.div key={chat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card p-4 flex items-center gap-4 cursor-pointer group" onClick={() => navigate(`/chat/${chat.id}`)}>
              <div className={cx('w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0', chat.avatarColor)}>{chat.avatarLetter}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-memoir-800 truncate flex items-center gap-1.5">{chat.contactName}{chat.isDemo && <span className="text-[9px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">Demo</span>}</h3>
                  <span className="text-xs text-memoir-300 ml-2 shrink-0 flex items-center gap-1.5">{chat.hasMedia && <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1"><ImageIcon size={10} />{chat.mediaCount}</span>}{chat.messageCount} msgs • RAM • Starrable</span>
                </div>
                <p className="text-sm text-memoir-400 truncate mt-1">{chat.lastMessage || 'No messages'}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete from RAM?')) handleDeleteChat(chat.id); }} className="p-2 text-memoir-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
