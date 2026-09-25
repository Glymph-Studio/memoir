import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Search, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChats, saveChats, saveMessages, generateId } from '../lib/storage';
import { processChatFile, determineMyMessages } from '../lib/whatsapp-parser';
import { getAvatarColor, getAvatarLetter, truncate, cx } from '../lib/utils';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [chats, setChats] = useState([]);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const c = await getChats(user.id);
      if (mounted) setChats(c);
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
      <div className="mb-7">
        <h1 className="text-3xl font-display font-bold text-memoir-800">Your Chats</h1>
        <p className="text-memoir-400 text-sm mt-1">Import a conversation or explore the demo.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..." className="input-field pl-10" />
        </div>
        <input type="file" accept=".txt,.zip" onChange={handleImport} ref={fileRef} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="btn-primary flex items-center justify-center gap-2 min-w-[140px]" disabled={importing}><Upload size={18} />{importing ? `${progress}%` : 'Import Chat'}</button>
        <button onClick={createDemoChat} className="btn-secondary flex items-center justify-center gap-2"><Sparkles size={16} />Try Demo</button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      {importing && (
        <div className="mb-4 p-4 card">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin w-5 h-5 border-2 border-memoir-200 border-t-memoir-500 rounded-full" />
            <div className="flex-1"><p className="text-sm font-medium text-memoir-700">Importing your conversation...</p></div>
            <span className="text-sm font-mono text-memoir-500">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-memoir-100 rounded-full overflow-hidden"><div className="h-full bg-memoir-500 transition-all duration-200" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {filteredChats.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-memoir-600 mb-2">{chats.length === 0 ? 'No chats yet' : 'No matching chats'}</h3>
          <p className="text-memoir-400 text-sm mb-2 max-w-md mx-auto">{chats.length === 0 ? 'Import a WhatsApp conversation or start with the demo.' : 'Try a different search.'}</p>
          {chats.length === 0 && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button onClick={() => fileRef.current?.click()} className="btn-primary"><Upload size={18} className="inline mr-2" />Import Chat</button>
              <button onClick={createDemoChat} className="btn-secondary"><Sparkles size={18} className="inline mr-2" />Try Demo Chat</button>
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
                  <span className="text-xs text-memoir-300 ml-2 shrink-0 flex items-center gap-1.5">{chat.hasMedia && <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1"><ImageIcon size={10} />{chat.mediaCount}</span>}{chat.messageCount} messages</span>
                </div>
                <p className="text-sm text-memoir-400 truncate mt-1">{chat.lastMessage || 'No messages'}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this chat?')) handleDeleteChat(chat.id); }} className="p-2 text-memoir-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
