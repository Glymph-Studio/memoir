import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Trash2, Edit3, Check, X, Clock, Layers, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getScrapbooks, saveScrapbooks, generateId } from '../lib/storage';
import { getRandomThemeColor } from '../lib/utils';
import PrivacyBanner from '../components/PrivacyBanner';

const THEME_PREVIEW = {
  cream: '#f5f0e8', kraft: '#c4a882', white: '#ffffff',
  vintage: '#e8dcc8', dark: '#2a2a2a', rose: '#f5e0e0',
  sage: '#dce8dc', sky: '#d8e8f0',
};

export default function Scrapbooks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrapbooks, setScrapbooks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log('[Scrapbooks] Loading for user', user.id);
        const books = await getScrapbooks(user.id);
        console.log('[Scrapbooks] Loaded', books.length, 'books');
        if (mounted) {
          setScrapbooks(books);
          setLoading(false);
        }
      } catch (e) {
        console.error('[Scrapbooks] Load failed', e);
        if (mounted) {
          setError(e.message);
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [user.id]);

  const handleCreate = async () => {
    try {
      const newScrapbook = {
        id: generateId(),
        title: `Scrapbook ${scrapbooks.length + 1}`,
        elementsJson: '[]',
        thumbnailColor: getRandomThemeColor(),
        theme: 'cream',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newScrapbook, ...scrapbooks];
      setScrapbooks(updated);
      await saveScrapbooks(user.id, updated);
      console.log('[Scrapbooks] Created', newScrapbook.id);
      navigate(`/canvas/${newScrapbook.id}`);
    } catch (e) {
      console.error('[Scrapbooks] Create failed', e);
      alert('Failed to create scrapbook: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this scrapbook permanently?')) return;
    const updated = scrapbooks.filter(s => s.id !== id);
    setScrapbooks(updated);
    await saveScrapbooks(user.id, updated);
  };

  const startEditing = (sb, e) => {
    e.stopPropagation();
    setEditingId(sb.id);
    setEditTitle(sb.title);
  };

  const saveTitle = async (id) => {
    if (!editTitle.trim()) return;
    const updated = scrapbooks.map(s => s.id === id ? { ...s, title: editTitle.trim(), updatedAt: new Date().toISOString() } : s);
    setScrapbooks(updated);
    await saveScrapbooks(user.id, updated);
    setEditingId(null);
  };

  const getElements = (sb) => {
    try { return JSON.parse(sb.elementsJson || '[]'); } catch { return []; }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-memoir-200 border-t-memoir-500 rounded-full animate-spin mb-3" />
        <p className="text-sm text-memoir-400">Loading scrapbooks from IndexedDB...</p>
        <p className="text-xs text-memoir-300 mt-1">User: {user.id?.slice(0,8)}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-2">Failed to load: {error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PrivacyBanner />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-memoir-800 flex items-center gap-2">Scrapbooks <span className="text-[11px] bg-memoir-100 text-memoir-600 px-2 py-0.5 rounded-full">{scrapbooks.length}</span></h1>
          <p className="text-memoir-400 text-sm mt-1 flex items-center gap-1.5"><Shield size={12} className="text-emerald-500" /> Saved locally in IndexedDB • Never uploaded • 60fps canvas</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2 shadow-lg shadow-memoir-200">
          <Plus size={18} /><span className="hidden sm:inline">New Scrapbook</span><span className="sm:hidden">New</span>
        </button>
      </div>

      {scrapbooks.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-memoir-50 rounded-3xl flex items-center justify-center"><BookOpen size={40} className="text-memoir-300" /></div>
          <h3 className="text-xl font-semibold text-memoir-600 mb-2">No scrapbooks yet</h3>
          <p className="text-memoir-400 text-sm mb-2 max-w-xs mx-auto">Create your first scrapbook. Privacy-first: scrapbooks saved locally, chats stay in RAM only.</p>
          <p className="text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-full mb-8">🔒 Chats never touch disk</p>
          <div><button onClick={handleCreate} className="btn-primary inline-flex items-center gap-2"><Plus size={18} />Create Your First Scrapbook</button></div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {scrapbooks.map((sb, i) => {
              const elements = getElements(sb);
              const bgColor = THEME_PREVIEW[sb.theme] || sb.thumbnailColor || '#f5f0e8';
              return (
                <motion.div key={sb.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.04, duration: 0.3 }} className="group cursor-pointer" onClick={() => { console.log('[Scrapbooks] Opening', sb.id); navigate(`/canvas/${sb.id}`); }}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100">
                    <div className="h-44 relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                      <div className="absolute inset-0 opacity-20"><div className="absolute top-4 left-6 w-16 h-16 rounded-lg bg-white/40 rotate-6" /><div className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/30 -rotate-12" /></div>
                      <div className="text-center z-10"><div className="text-3xl mb-1">📖</div>{elements.length === 0 && <p className="text-xs opacity-50 font-medium">Click to open</p>}</div>
                      {elements.length > 0 && <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/20 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm"><Layers size={12} />{elements.length}</div>}
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={(e) => startEditing(sb, e)} className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-neutral-500 hover:text-neutral-700 shadow-sm"><Edit3 size={13} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(sb.id); }} className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-neutral-400 hover:text-red-500 shadow-sm"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="p-4">
                      {editingId === sb.id ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveTitle(sb.id); if (e.key === 'Escape') setEditingId(null); }} className="flex-1 text-sm font-medium border border-memoir-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-memoir-400" autoFocus />
                          <button onClick={() => saveTitle(sb.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-neutral-400 hover:bg-neutral-50 rounded"><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-neutral-800 text-sm group-hover:text-memoir-700 transition-colors">{sb.title}</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-neutral-300"><Clock size={11} />{timeAgo(sb.updatedAt)}</span>
                            {elements.length > 0 && <span className="text-xs text-neutral-300">{elements.length} element{elements.length !== 1 ? 's' : ''}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
