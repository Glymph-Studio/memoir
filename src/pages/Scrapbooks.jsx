import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Trash2, Edit3, Check, X, Clock, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getScrapbooks, saveScrapbooks, generateId } from '../lib/storage';
import { getRandomThemeColor } from '../lib/utils';

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
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const books = await getScrapbooks(user.id);
        if (active) setScrapbooks(Array.isArray(books) ? books : []);
      } catch (err) {
        if (active) setError(err?.message || 'Could not load your scrapbooks');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user.id]);

  const handleCreate = async () => {
    const book = {
      id: generateId(),
      title: `Scrapbook ${scrapbooks.length + 1}`,
      elementsJson: '[]',
      thumbnailColor: getRandomThemeColor(),
      theme: 'cream',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const updated = [book, ...scrapbooks];
      setScrapbooks(updated);
      await saveScrapbooks(user.id, updated);
      navigate(`/canvas/${book.id}`);
    } catch (err) {
      setError(err?.message || 'Could not create scrapbook');
    }
  };

  const handleDelete = async (id, event) => {
    event.stopPropagation();
    if (!window.confirm('Delete this scrapbook?')) return;
    const updated = scrapbooks.filter(book => book.id !== id);
    setScrapbooks(updated);
    await saveScrapbooks(user.id, updated);
  };

  const beginEdit = (book, event) => {
    event.stopPropagation();
    setEditingId(book.id);
    setEditTitle(book.title);
  };

  const saveTitle = async (id) => {
    const title = editTitle.trim();
    if (!title) return;
    const updated = scrapbooks.map(book => book.id === id
      ? { ...book, title, updatedAt: new Date().toISOString() }
      : book);
    setScrapbooks(updated);
    setEditingId(null);
    await saveScrapbooks(user.id, updated);
  };

  const elementCount = (book) => {
    try { return JSON.parse(book.elementsJson || '[]').length; }
    catch { return 0; }
  };

  const dateLabel = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  };

  if (loading) {
    return <div className="page-container py-20 text-center text-memoir-400">Loading scrapbooks...</div>;
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-memoir-800">Scrapbooks</h1>
          <p className="text-memoir-400 text-sm mt-1">Turn your favourite moments into something beautiful.</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> <span className="hidden sm:inline">New Scrapbook</span><span className="sm:hidden">New</span>
        </button>
      </div>

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      {scrapbooks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-memoir-50 rounded-3xl flex items-center justify-center">
            <BookOpen size={40} className="text-memoir-300" />
          </div>
          <h2 className="text-xl font-semibold text-memoir-700 mb-2">Create your first scrapbook</h2>
          <p className="text-memoir-400 text-sm mb-7">A blank canvas is waiting for your memories.</p>
          <button onClick={handleCreate} className="btn-primary inline-flex items-center gap-2"><Plus size={18} /> Create Scrapbook</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {scrapbooks.map(book => {
            const count = elementCount(book);
            const color = THEME_PREVIEW[book.theme] || book.thumbnailColor || '#f5f0e8';
            return (
              <article key={book.id} onClick={() => navigate(`/canvas/${book.id}`)} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:border-memoir-200 transition-colors">
                <div className="h-44 relative flex items-center justify-center" style={{ backgroundColor: color }}>
                  <BookOpen size={36} className="text-black/20" />
                  {count > 0 && <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/20 text-white text-xs px-2.5 py-1 rounded-full"><Layers size={12} /> {count}</span>}
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={event => beginEdit(book, event)} className="p-2 bg-white rounded-lg text-neutral-500" aria-label="Rename scrapbook"><Edit3 size={14} /></button>
                    <button onClick={event => handleDelete(book.id, event)} className="p-2 bg-white rounded-lg text-neutral-500 hover:text-red-500" aria-label="Delete scrapbook"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="p-4">
                  {editingId === book.id ? (
                    <div className="flex items-center gap-2" onClick={event => event.stopPropagation()}>
                      <input value={editTitle} onChange={event => setEditTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') saveTitle(book.id); }} className="input-field py-1" autoFocus />
                      <button onClick={() => saveTitle(book.id)} className="p-1 text-green-600"><Check size={17} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-neutral-400"><X size={17} /></button>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-semibold text-neutral-800">{book.title}</h2>
                      <p className="flex items-center gap-1 text-xs text-neutral-400 mt-1"><Clock size={11} /> {dateLabel(book.updatedAt)}</p>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
