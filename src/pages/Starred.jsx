import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StarOff, Eye, Search, Image as ImageIcon, ImageOff, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStarredMessages, saveStarredMessages } from '../lib/storage';
import { formatMessageTime, getAvatarColor, getAvatarLetter, cx } from '../lib/utils';

export default function Starred() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [imgErrors, setImgErrors] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getStarredMessages(user.id);
      if (mounted) {
        setStarred(s);
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

  const imageStarred = filtered.filter(m => m.mediaUrl);
  const textStarred = filtered.filter(m => !m.mediaUrl);

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
          <h1 className="text-2xl font-display font-bold text-memoir-800 flex items-center gap-2">Starred <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{starred.length} • {imageStarred.length} images</span></h1>
          <p className="text-memoir-400 text-sm mt-1 flex items-center gap-1"><Shield size={12} className="text-emerald-500" /> Memory-only • Images converted to dataURL when starred (with consent) for scrapbook use</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-memoir-300" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search starred..." className="pl-8 pr-3 py-2 text-sm border border-memoir-200 rounded-xl w-48 focus:outline-none focus:ring-2 focus:ring-memoir-200" />
        </div>
      </div>

      {filtered.length > 0 && imageStarred.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-memoir-700 mb-3 flex items-center gap-2"><ImageIcon size={16} /> Starred Images ({imageStarred.length}) • Tap to add to scrapbook</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageStarred.map(msg => (
              <div key={msg.id} className="group relative bg-white rounded-xl overflow-hidden border border-memoir-100 hover:shadow-md transition-all">
                <div className="aspect-square bg-memoir-50 relative overflow-hidden">
                  {msg.mediaUrl && !imgErrors.has(msg.id) ? (
                    <img src={msg.mediaUrl} alt="" className="w-full h-full object-cover" loading="eager" onError={() => setImgErrors(prev => new Set([...prev, msg.id]))} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-memoir-300"><ImageOff size={24} /><span className="text-[10px]">Expired</span></div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <button onClick={() => handleUnstar(msg.messageId)} className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-white opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"><StarOff size={14} /></button>
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-memoir-700 truncate">{msg.content || 'Photo'}</p>
                  <p className="text-[10px] text-memoir-400 truncate">{msg.sender} • {msg.contactName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {starred.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-lg font-medium text-memoir-600 mb-2">No starred messages</h3>
          <p className="text-memoir-400 text-sm">Star messages and images from chats to use in scrapbooks</p>
          <p className="text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-full mt-3">🔒 Starred items live in RAM only, images converted to persistent dataURL with your consent</p>
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
                        <button onClick={() => navigate(`/chat/${msg.chatId}`)} className="p-1.5 rounded-lg hover:bg-memoir-50 text-memoir-400 hover:text-memoir-600"><Eye size={14} /></button>
                        <button onClick={() => handleUnstar(msg.messageId)} className="p-1.5 rounded-lg hover:bg-red-50 text-memoir-400 hover:text-red-500"><StarOff size={14} /></button>
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
