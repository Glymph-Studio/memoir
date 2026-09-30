import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StarOff, Eye, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChats, getStarredMessages, saveStarredMessages } from '../lib/storage';
import { formatMessageTime, getAvatarColor, getAvatarLetter, cx } from '../lib/utils';

export default function Starred() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [savedStars, chats] = await Promise.all([
        getStarredMessages(user.id),
        getChats(user.id),
      ]);
      const chatIds = new Set(chats.map(chat => chat.id));
      const validStars = savedStars.filter(message => chatIds.has(message.chatId));
      if (validStars.length !== savedStars.length) {
        await saveStarredMessages(user.id, validStars);
      }
      if (mounted) {
        setStarred(validStars);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user.id]);

  const filtered = starred.filter(m => {
    if (!query) return true;
    const q = query.toLowerCase();
    return m.content.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q) || (m.contactName || '').toLowerCase().includes(q);
  });

  const grouped = filtered.reduce((acc, msg) => {
    const key = msg.contactName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const handleUnstar = async (msgId) => {
    const updated = starred.filter(s => s.messageId !== msgId);
    setStarred(updated);
    await saveStarredMessages(user.id, updated);
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-memoir-200 border-t-memoir-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-memoir-800 flex items-center gap-2">Starred <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{starred.length}</span></h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-memoir-300" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search starred..." className="pl-8 pr-3 py-2 text-sm border border-memoir-200 rounded-xl w-48 focus:outline-none focus:ring-2 focus:ring-memoir-200" />
        </div>
      </div>



      {starred.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-lg font-medium text-memoir-600 mb-2">No starred messages</h3>
          <p className="text-memoir-400 text-sm">Star messages and images from chats to use in scrapbooks</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><p className="text-memoir-400">No results for "{query}"</p></div>
      ) : (
        <AnimatePresence>
          {Object.entries(grouped).map(([contact, msgs]) => (
            <div key={contact} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={cx('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium', getAvatarColor(contact))}>{getAvatarLetter(contact)}</div>
                <h3 className="font-medium text-memoir-700">{contact}</h3>
                <span className="text-xs text-memoir-300">({msgs.length})</span>
              </div>
              <div className="space-y-2 ml-11">
                {msgs.filter(m => !m.mediaUrl).map((msg) => (
                  <motion.div key={msg.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10, height: 0 }} className="card p-4 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-memoir-700 whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs text-memoir-300 mt-1">{msg.sender} · {formatMessageTime(msg.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/chat/${msg.chatId}`)} aria-label="Open original chat" className="p-1.5 rounded-lg hover:bg-memoir-50 text-memoir-400 hover:text-memoir-600"><Eye size={14} /></button>
                        <button onClick={() => handleUnstar(msg.messageId)} aria-label="Remove star" className="p-1.5 rounded-lg hover:bg-red-50 text-memoir-400 hover:text-red-500"><StarOff size={14} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
