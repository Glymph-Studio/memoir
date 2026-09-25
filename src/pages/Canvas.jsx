import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Undo, Redo, Type, Image as ImageIcon,
  StickyNote, Smile, Palette, X, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Trash2, RotateCw,
  ZoomIn, ZoomOut, Lock, Unlock, Copy,
  Layers, Calendar, Tag, MessageSquare,
  Settings, AlertTriangle, ImageOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getScrapbooks, saveScrapbooks, getStarredMessages, generateId } from '../lib/storage';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { useDebouncedPersist } from '../hooks/useDebouncedPersist';
import { CanvasElement, BUBBLE_PRESETS } from '../components/canvas/CanvasElement';
import { cx } from '../lib/utils';

const THEMES = {
  cream: { bg: '#f5f0e8', label: 'Cream', emoji: '🤎' },
  kraft: { bg: '#c4a882', label: 'Kraft', emoji: '🪵' },
  white: { bg: '#ffffff', label: 'White', emoji: '⬜' },
  vintage: { bg: '#e8dcc8', label: 'Vintage', emoji: '📜' },
  dark: { bg: '#2a2a2a', label: 'Dark', emoji: '⬛' },
  rose: { bg: '#f5e0e0', label: 'Rose', emoji: '🌹' },
  sage: { bg: '#dce8dc', label: 'Sage', emoji: '🌿' },
  sky: { bg: '#d8e8f0', label: 'Sky', emoji: '☁️' },
};

const STICKER_CATEGORIES = {
  'Smileys': ['😊','😂','🥰','😎','🤩','😍','🥳','😇','🤗','🤭','😋','🤓','😏','🥺','😤','🫠'],
  'Hearts':  ['❤️','💕','💖','💗','💝','💘','💔','🩷','🧡','💛','💚','💙','💜','🖤','🤍','🫶'],
  'Hands':   ['👍','👏','🙌','🤝','✌️','🤞','💪','🤟','👋','✋','🤙','🫰','🤘','🫵','☝️','🤌'],
  'Nature':  ['🌸','🌺','🌻','🌹','🌷','🍃','🌿','🍀','⭐','🌈','☀️','🌙','❄️','🔥','💫','✨'],
  'Travel':  ['✈️','🗺️','📍','🏖️','⛺','🎡','🚗','🚀','⛵','🏔️','📸','🎞️','🎪','🛤️','🌅','🏖️'],
  'Food':    ['☕','🍕','🎂','🧁','🍩','🍪','🍷','🍹','🌮','🍔','🍱','🍫','🍰','🥂','🍸','🍿'],
  'Decor':   ['🎀','🎉','🎊','🎈','🎁','🦋','🪄','📌','💌','🏷️','💐','🪷','🪻','🕯️','🧸','🎨'],
};

const NOTE_COLORS = [
  { bg: '#fef9c3', border: '#fde047', label: 'Yellow' },
  { bg: '#bbf7d0', border: '#86efac', label: 'Green' },
  { bg: '#bfdbfe', border: '#93c5fd', label: 'Blue' },
  { bg: '#fecaca', border: '#fca5a5', label: 'Red' },
  { bg: '#e9d5ff', border: '#d8b4fe', label: 'Purple' },
  { bg: '#fed7aa', border: '#fdba74', label: 'Orange' },
  { bg: '#f0fdf4', border: '#bbf7d0', label: 'Mint' },
  { bg: '#fce7f3', border: '#f9a8d4', label: 'Pink' },
];

const WASHI_TAPES = [
  { bg: 'linear-gradient(135deg, #fecdd3 25%, #fda4af 25%, #fda4af 50%, #fecdd3 50%, #fecdd3 75%, #fda4af 75%)', bgSize: '8px 8px', label: 'Pink' },
  { bg: 'linear-gradient(135deg, #bfdbfe 25%, #93c5fd 25%, #93c5fd 50%, #bfdbfe 50%, #bfdbfe 75%, #93c5fd 75%)', bgSize: '8px 8px', label: 'Blue' },
  { bg: 'linear-gradient(135deg, #bbf7d0 25%, #86efac 25%, #86efac 50%, #bbf7d0 50%, #bbf7d0 75%, #86efac 75%)', bgSize: '8px 8px', label: 'Green' },
  { bg: 'linear-gradient(135deg, #fef08a 25%, #fde047 25%, #fde047 50%, #fef08a 50%, #fef08a 75%, #fde047 75%)', bgSize: '8px 8px', label: 'Yellow' },
  { bg: 'linear-gradient(135deg, #e9d5ff 25%, #d8b4fe 25%, #d8b4fe 50%, #e9d5ff 50%, #e9d5ff 75%, #d8b4fe 75%)', bgSize: '8px 8px', label: 'Purple' },
  { bg: '#f5f5f4', bgSize: 'auto', label: 'White' },
  { bg: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px), #d4a5a5', bgSize: 'auto', label: 'Mauve' },
  { bg: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px), #a5c4d4', bgSize: 'auto', label: 'Teal' },
];

const FONTS = [
  { value: "'Inter', sans-serif", label: 'Sans' },
  { value: 'Georgia, serif', label: 'Serif' },
  { value: "'Caveat', cursive", label: 'Hand' },
  { value: "'Dancing Script', cursive", label: 'Script' },
  { value: "'Playfair Display', serif", label: 'Display' },
  { value: 'monospace', label: 'Type' },
];

export default function Canvas() {
  const { scrapbookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [scrapbook, setScrapbook] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [starredMessages, setStarredMessages] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [showProps, setShowProps] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef();
  const workspaceRef = useRef();
  const interactionRef = useRef({ mode: 'idle' });
  const lastTapRef = useRef(0);
  const rafRef = useRef(0);
  const maxZRef = useRef(1);

  const { pushHistory, undo: undoHistory, redo: redoHistory, canUndo, canRedo } = useCanvasHistory([], 50);

  // Robust load with retries
  useEffect(() => {
    let mounted = true;
    let retries = 0;
    const maxRetries = 3;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        console.log('[Canvas] Loading scrapbook', scrapbookId, 'for user', user.id);
        const books = await getScrapbooks(user.id);
        console.log('[Canvas] Found', books.length, 'scrapbooks');
        const found = books.find(b => b.id === scrapbookId);
        if (!found) {
          if (retries < maxRetries) {
            retries++;
            console.warn(`[Canvas] Scrapbook not found, retry ${retries}/${maxRetries}`);
            setTimeout(load, 500);
            return;
          }
          console.error('[Canvas] Scrapbook not found after retries', scrapbookId);
          setLoadError(`Scrapbook not found. It may have been deleted or not saved. ID: ${scrapbookId}`);
          setTimeout(() => navigate('/scrapbooks'), 2000);
          return;
        }
        if (!mounted) return;
        setScrapbook(found);
        try {
          const els = JSON.parse(found.elementsJson || '[]');
          // Validate elements - fix broken image src
          const validEls = els.map(el => {
            if (el.type === 'image' && !el.src) {
              return {...el, src: '', w: el.w || 100, h: el.h || 100};
            }
            return el;
          });
          setElements(validEls);
          maxZRef.current = Math.max(1, ...validEls.map(e => e.zIndex || 0));
          console.log('[Canvas] Loaded', validEls.length, 'elements');
        } catch (e) {
          console.error('[Canvas] Failed to parse elements', e);
          setElements([]);
        }
        try {
          const starred = await getStarredMessages(user.id);
          if (mounted) setStarredMessages(starred);
        } catch (e) {
          console.warn('[Canvas] Failed to load starred', e);
          setStarredMessages([]);
        }
      } catch (e) {
        console.error('[Canvas] Load failed', e);
        if (mounted) setLoadError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (user?.id && scrapbookId) load();
    return () => { mounted = false; };
  }, [scrapbookId, user?.id, navigate]);

  const persistFn = useCallback(async (els) => {
    if (!scrapbookId || !user?.id) return;
    setSaveStatus('saving');
    try {
      const books = await getScrapbooks(user.id);
      const idx = books.findIndex(b => b.id === scrapbookId);
      if (idx >= 0) {
        // For privacy, don't persist blob: URLs from WhatsApp media in scrapbook - convert to placeholder
        const sanitizedEls = els.map(el => {
          if (el.type === 'chatbubble' && el.mediaUrl && el.mediaUrl.startsWith('blob:')) {
            // Keep blob URL for current session, but it will be invalid after reload - that's privacy by design
            // We keep it, but warn user it won't persist
            return el;
          }
          return el;
        });
        books[idx] = { ...books[idx], elementsJson: JSON.stringify(sanitizedEls), updatedAt: new Date().toISOString() };
        await saveScrapbooks(user.id, books);
        setScrapbook({ ...books[idx] });
        setSaveStatus('saved');
        console.log('[Canvas] Saved', sanitizedEls.length, 'elements');
      } else {
        console.warn('[Canvas] Scrapbook not found in persist', scrapbookId);
        setSaveStatus('unsaved');
      }
    } catch (e) {
      console.error('Persist failed', e);
      setSaveStatus('unsaved');
    }
  }, [user?.id, scrapbookId]);

  const { schedule: schedulePersist, flush: flushPersist, immediate: immediatePersist } = useDebouncedPersist(persistFn, 700);

  const setElementsAndPersist = useCallback((newEls, { immediate = false, history = false, prevEls = null } = {}) => {
    setElements(newEls);
    maxZRef.current = Math.max(maxZRef.current, ...newEls.map(e => e.zIndex || 0));
    if (history && prevEls) pushHistory(prevEls);
    if (immediate) immediatePersist(newEls);
    else schedulePersist(newEls);
    setSaveStatus('unsaved');
  }, [pushHistory, schedulePersist, immediatePersist]);

  const getNextZ = useCallback(() => { maxZRef.current += 1; return maxZRef.current; }, []);

  const addElement = useCallback((element) => {
    const newEl = {
      id: generateId(),
      x: 80 + Math.random() * 200,
      y: 60 + Math.random() * 150,
      w: 150, h: 100,
      rotation: 0,
      zIndex: getNextZ(),
      locked: false,
      opacity: 1,
      ...element,
    };
    const prev = elements;
    const newEls = [...elements, newEl];
    setElements(newEls);
    pushHistory(prev);
    immediatePersist(newEls);
    setSelectedId(newEl.id);
    setEditingId(newEl.type === 'text' || newEl.type === 'note' ? newEl.id : null);
    setShowProps(false);
    return newEl;
  }, [elements, getNextZ, pushHistory, immediatePersist]);

  const updateElementImmediate = useCallback((id, updates) => {
    setElements(prev => {
      const newEls = prev.map(el => el.id === id ? { ...el, ...updates } : el);
      schedulePersist(newEls);
      return newEls;
    });
  }, [schedulePersist]);

  const updateElementTransient = useCallback((id, updates) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const deleteElement = useCallback((id) => {
    const prev = elements;
    const newEls = elements.filter(el => el.id !== id);
    setElementsAndPersist(newEls, { immediate: true, history: true, prevEls: prev });
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
    setShowProps(false);
  }, [elements, selectedId, editingId, setElementsAndPersist]);

  const duplicateElement = useCallback((id) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const prev = elements;
    const newEls = [...elements, { ...el, id: generateId(), x: el.x + 15, y: el.y + 15, zIndex: getNextZ() }];
    setElementsAndPersist(newEls, { immediate: true, history: true, prevEls: prev });
  }, [elements, getNextZ, setElementsAndPersist]);

  const sendToBack = useCallback((id) => {
    const minZ = Math.min(...elements.map(e => e.zIndex || 0));
    updateElementImmediate(id, { zIndex: minZ - 1 });
  }, [elements, updateElementImmediate]);

  const finishEditing = useCallback(() => { setEditingId(null); flushPersist(); }, [flushPersist]);

  const handleCanvasPointerDown = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas-bg')) {
      setSelectedId(null); setEditingId(null); setShowProps(false);
    }
  }, []);

  const handleElementPointerDown = useCallback((e, id) => {
    e.stopPropagation();
    if (editingId === id) return;
    const el = elements.find(el => el.id === id);
    if (!el) return;
    const now = Date.now();
    const lastTap = lastTapRef.current;
    lastTapRef.current = now;
    if (now - lastTap < 300 && (el.type === 'text' || el.type === 'note' || el.type === 'chatbubble' || el.type === 'datestamp')) {
      setEditingId(id); setSelectedId(id); return;
    }
    setSelectedId(id); setShowProps(false);
    if (el.locked) return;
    setElements(prev => prev.map(p => p.id === id ? { ...p, zIndex: getNextZ() } : p));
    const startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    interactionRef.current = { mode: 'pending', elementId: id, startX, startY, elStartX: el.x, elStartY: el.y, hasPushedHistory: false, prevElements: [...elements] };
    const onMove = (ev) => {
      const clientX = ev.clientX ?? ev.touches?.[0]?.clientX ?? 0;
      const clientY = ev.clientY ?? ev.touches?.[0]?.clientY ?? 0;
      const ref = interactionRef.current;
      if (ref.mode === 'pending') {
        const dx = clientX - ref.startX; const dy = clientY - ref.startY;
        if (Math.sqrt(dx*dx+dy*dy) < 5) return;
        ref.mode = 'dragging';
        if (!ref.hasPushedHistory) { pushHistory(ref.prevElements); ref.hasPushedHistory = true; }
      }
      if (ref.mode === 'dragging') {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const r = interactionRef.current;
          if (r.mode !== 'dragging') return;
          const newX = r.elStartX + (clientX - r.startX) / zoom;
          const newY = r.elStartY + (clientY - r.startY) / zoom;
          const snap = 8;
          const snappedX = Math.round(newX / snap) * snap;
          const snappedY = Math.round(newY / snap) * snap;
          updateElementTransient(r.elementId, { x: snappedX, y: snappedY });
        });
      }
    };
    const onUp = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const ref = interactionRef.current;
      if (ref.mode === 'dragging') setElements(curr => { schedulePersist(curr); setSaveStatus('unsaved'); return curr; });
      interactionRef.current.mode = 'idle';
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp);
  }, [elements, editingId, zoom, getNextZ, pushHistory, updateElementTransient, schedulePersist]);

  const handleResizeStart = useCallback((e, id, corner) => {
    e.stopPropagation(); e.preventDefault();
    const el = elements.find(el => el.id === id); if (!el) return;
    const prev = [...elements]; pushHistory(prev);
    const startX = e.clientX; const startY = e.clientY;
    const { w: startW, h: startH, x: startElX, y: startElY } = el;
    const onMove = (ev) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const dx = (ev.clientX - startX) / zoom; const dy = (ev.clientY - startY) / zoom;
        let newW = startW, newH = startH, newX = startElX, newY = startElY;
        if (corner.includes('r')) newW = Math.max(40, startW + dx);
        if (corner.includes('l')) { newW = Math.max(40, startW - dx); newX = startElX + (startW - newW); }
        if (corner.includes('b')) newH = Math.max(30, startH + dy);
        if (corner.includes('t')) { newH = Math.max(30, startH - dy); newY = startElY + (startH - newH); }
        updateElementTransient(id, { w: newW, h: newH, x: newX, y: newY });
      });
    };
    const onUp = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setElements(curr => { schedulePersist(curr); return curr; });
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  }, [elements, zoom, pushHistory, updateElementTransient, schedulePersist]);

  const handleRotateStart = useCallback((e, id) => {
    e.stopPropagation(); e.preventDefault();
    const el = elements.find(el => el.id === id); if (!el) return;
    const prev = [...elements]; pushHistory(prev);
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + (el.x + el.w/2) * zoom; const centerY = rect.top + (el.y + el.h/2) * zoom;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const startRotation = (el.rotation || 0) * Math.PI / 180;
    const onMove = (ev) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
        let deg = (startRotation + angle - startAngle) * 180 / Math.PI;
        if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
        updateElementTransient(id, { rotation: deg });
      });
    };
    const onUp = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setElements(curr => { schedulePersist(curr); return curr; });
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  }, [elements, zoom, pushHistory, updateElementTransient, schedulePersist]);

  const handleAddText = useCallback(() => { addElement({ type: 'text', content: 'Type here', fontFamily: "'Inter', sans-serif", fontSize: 20, color: '#2a2a2a', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', w: 200, h: 50 }); setActivePanel(null); }, [addElement]);

  const handleAddImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      if (file.size > 10 * 1024 * 1024) { alert('Image too large (max 10MB)'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale; canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          console.log('[Canvas] Added image', file.name, 'compressed', (compressed.length/1024).toFixed(0), 'KB');
          addElement({ type: 'image', src: compressed, originalName: file.name, w: canvas.width, h: canvas.height });
        };
        img.onerror = () => { console.error('Failed to load image'); alert('Failed to load image'); };
        img.src = ev.target.result;
      };
      reader.onerror = () => alert('Failed to read file');
      reader.readAsDataURL(file);
    };
    input.click(); setActivePanel(null);
  }, [addElement]);

  const handleAddNote = useCallback((c) => { addElement({ type: 'note', content: '', noteBg: c.bg, noteBorder: c.border, fontFamily: "'Caveat', cursive", fontSize: 20, color: '#333', w: 170, h: 170 }); setActivePanel(null); }, [addElement]);
  const handleAddSticker = useCallback((emoji) => { addElement({ type: 'sticker', content: emoji, w: 64, h: 64 }); setActivePanel(null); }, [addElement]);
  const handleAddWashi = useCallback((tape) => { addElement({ type: 'washi', washiBg: tape.bg, washiBgSize: tape.bgSize, w: 220, h: 22 }); setActivePanel(null); }, [addElement]);
  const handleAddDateStamp = useCallback(() => { addElement({ type: 'datestamp', content: new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }), fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#555', w: 240, h: 48 }); setActivePanel(null); }, [addElement]);

  const handleAddChatBubble = useCallback((msg) => {
    const preset = BUBBLE_PRESETS.whatsapp;
    addElement({
      type: 'chatbubble', content: msg.content, sender: msg.sender, timestamp: msg.timestamp, isMine: msg.isMine,
      mediaUrl: msg.mediaUrl, bubbleStyle: 'whatsapp', mineBg: preset.mineBg, otherBg: preset.otherBg,
      mineColor: preset.mineColor, otherColor: preset.otherColor, showSender: true, showTime: true, w: 260, h: msg.mediaUrl ? 200 : 80,
    });
    setActivePanel(null);
  }, [addElement]);

  const handleThemeChange = useCallback(async (key) => {
    try {
      const books = await getScrapbooks(user.id);
      const idx = books.findIndex(b => b.id === scrapbookId);
      if (idx >= 0) { books[idx] = { ...books[idx], theme: key, updatedAt: new Date().toISOString() }; await saveScrapbooks(user.id, books); setScrapbook({ ...books[idx] }); }
    } catch (e) { console.error('Theme change failed', e); }
  }, [user?.id, scrapbookId]);

  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;
    const prev = selectedId; setSelectedId(null); setEditingId(null);
    await new Promise(r => setTimeout(r, 150));
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(canvasRef.current, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true, logging: false, ignoreElements: (el) => el.classList?.contains('canvas-ctrl') });
      const link = document.createElement('a'); link.download = `${scrapbook?.title || 'scrapbook'}.png`; link.href = canvas.toDataURL('image/png'); link.click();
    } catch (err) { console.error('Export failed:', err); alert('Export failed: ' + err.message); }
    setSelectedId(prev);
  }, [selectedId, scrapbook]);

  const undo = useCallback(() => { const prev = undoHistory(elements); if (prev) { setElements(prev); immediatePersist(prev); } }, [elements, undoHistory, immediatePersist]);
  const redo = useCallback(() => { const next = redoHistory(elements); if (next) { setElements(next); immediatePersist(next); } }, [elements, redoHistory, immediatePersist]);

  useEffect(() => {
    const ws = workspaceRef.current; if (!ws) return;
    let initialDist = 0; let initialZoom = 1;
    const onTouchStart = (e) => { if (e.touches.length === 2) { e.preventDefault(); initialDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); initialZoom = zoom; } };
    const onTouchMove = (e) => { if (e.touches.length === 2) { e.preventDefault(); const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); setZoom(Math.max(0.3, Math.min(2.5, initialZoom * (dist / initialDist)))); } };
    ws.addEventListener('touchstart', onTouchStart, { passive: false }); ws.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => { ws.removeEventListener('touchstart', onTouchStart); ws.removeEventListener('touchmove', onTouchMove); };
  }, [zoom]);

  useEffect(() => {
    const handleKey = (e) => {
      if (editingId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedId) { e.preventDefault(); deleteElement(selectedId); } }
      if (e.key === 'Escape') { setSelectedId(null); setEditingId(null); setActivePanel(null); setShowProps(false); }
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); if (selectedId) duplicateElement(selectedId); }
    };
    window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, editingId, undo, redo, deleteElement, duplicateElement]);

  useEffect(() => { const onBeforeUnload = () => flushPersist(); window.addEventListener('beforeunload', onBeforeUnload); return () => window.removeEventListener('beforeunload', onBeforeUnload); }, [flushPersist]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-neutral-500">Loading scrapbook...</p>
        <p className="text-xs text-neutral-400 mt-1">ID: {scrapbookId?.slice(0,8)}...</p>
      </div>
    </div>
  );

  if (loadError) return (
    <div className="h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
        <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
        <h3 className="font-semibold text-neutral-800 mb-2">Failed to load scrapbook</h3>
        <p className="text-sm text-neutral-500 mb-4">{loadError}</p>
        <button onClick={() => navigate('/scrapbooks')} className="btn-primary w-full">Back to Scrapbooks</button>
        <button onClick={() => window.location.reload()} className="btn-secondary w-full mt-2">Retry</button>
      </div>
    </div>
  );

  if (!scrapbook) return (
    <div className="h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <p className="text-sm text-neutral-500">Scrapbook not found, redirecting...</p>
      </div>
    </div>
  );

  const selectedElement = useMemo(() => elements.find(el => el.id === selectedId), [elements, selectedId]);
  const theme = THEMES[scrapbook.theme] || THEMES.cream;

  return (
    <div className="h-[100dvh] flex flex-col bg-neutral-100 overflow-hidden select-none">
      <div className="flex items-center justify-between px-2 py-1.5 bg-white border-b border-neutral-200 z-50 shrink-0">
        <div className="flex items-center gap-1.5">
          <button onClick={() => { flushPersist(); navigate('/scrapbooks'); }} className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-all">
            <ArrowLeft size={18} className="text-neutral-500" />
          </button>
          <div className="w-px h-5 bg-neutral-200" />
          <h2 className="font-semibold text-neutral-800 text-sm truncate max-w-[140px]">{scrapbook.title}</h2>
          <span className={cx('text-[10px] px-1.5 py-0.5 rounded-full ml-1', saveStatus === 'saved' ? 'bg-green-50 text-green-600' : saveStatus === 'saving' ? 'bg-amber-50 text-amber-600' : 'bg-neutral-100 text-neutral-500')}>
            {saveStatus === 'saved' ? '● Saved' : saveStatus === 'saving' ? '○ Saving...' : '○ Unsaved'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!canUndo} className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-20 active:scale-95" title="Undo (Ctrl+Z)"><Undo size={16} className="text-neutral-500" /></button>
          <button onClick={redo} disabled={!canRedo} className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-20 active:scale-95" title="Redo (Ctrl+Y)"><Redo size={16} className="text-neutral-500" /></button>
          <div className="w-px h-5 bg-neutral-200 mx-0.5" />
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95"><ZoomOut size={15} className="text-neutral-500" /></button>
          <span className="text-[10px] text-neutral-400 w-9 text-center font-medium">{Math.round(zoom*100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95"><ZoomIn size={15} className="text-neutral-500" /></button>
          <div className="w-px h-5 bg-neutral-200 mx-0.5" />
          <button onClick={handleExport} className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 active:scale-95 transition-all"><Download size={13} /> Export</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="hidden md:flex w-[56px] bg-white border-r border-neutral-200 flex-col items-center py-2 gap-0.5 shrink-0 z-40">
          <ToolBtn icon={<Type size={17}/>} label="Text" onClick={handleAddText} />
          <ToolBtn icon={<ImageIcon size={17}/>} label="Photo" onClick={handleAddImage} />
          <ToolBtn icon={<MessageSquare size={17}/>} label="Chat" active={activePanel==='chatbubble'} onClick={()=>setActivePanel(p=>p==='chatbubble'?null:'chatbubble')} />
          <ToolBtn icon={<StickyNote size={17}/>} label="Notes" active={activePanel==='note'} onClick={()=>setActivePanel(p=>p==='note'?null:'note')} />
          <ToolBtn icon={<Smile size={17}/>} label="Sticker" active={activePanel==='sticker'} onClick={()=>setActivePanel(p=>p==='sticker'?null:'sticker')} />
          <ToolBtn icon={<Calendar size={17}/>} label="Date" onClick={handleAddDateStamp} />
          <ToolBtn icon={<Tag size={17}/>} label="Washi" active={activePanel==='washi'} onClick={()=>setActivePanel(p=>p==='washi'?null:'washi')} />
          <div className="border-t border-neutral-100 my-1 w-7" />
          <ToolBtn icon={<Palette size={17}/>} label="Theme" active={activePanel==='theme'} onClick={()=>setActivePanel(p=>p==='theme'?null:'theme')} />
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-3" ref={workspaceRef} onWheel={(e) => { if (e.ctrlKey||e.metaKey) { e.preventDefault(); setZoom(z=>Math.max(0.3,Math.min(2.5,z-e.deltaY*0.002))); }}} style={{ backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <div className="relative shadow-2xl ring-1 ring-black/5" style={{ width: 800, height: 600, backgroundColor: theme.bg, transform: `scale(${zoom})`, transformOrigin: 'center center', flexShrink: 0 }} ref={canvasRef} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const d=e.dataTransfer?.getData('application/memoir-image');if(d){const r=canvasRef.current.getBoundingClientRect();addElement({type:'image',src:d,x:(e.clientX-r.left)/zoom-100,y:(e.clientY-r.top)/zoom-100,w:200,h:200});}}} onPointerDown={handleCanvasPointerDown}>
            <div className="absolute inset-0 pointer-events-none canvas-bg" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`}} />
            {elements.map(el => (
              <CanvasElement key={el.id} element={el} isSelected={selectedId === el.id} isEditing={editingId === el.id} onPointerDown={(e) => handleElementPointerDown(e, el.id)} onResizeStart={handleResizeStart} onRotateStart={handleRotateStart} onUpdate={(u) => updateElementImmediate(el.id, u)} onStopEditing={finishEditing} />
            ))}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center opacity-30">
                  <p className="text-lg font-medium">Empty canvas</p>
                  <p className="text-sm">Add text, photos, stickers, or starred chats</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {activePanel && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="hidden md:block bg-white border-l border-neutral-200 overflow-hidden shrink-0 z-40">
              <div className="w-[280px] h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-700 text-sm capitalize">{activePanel === 'chatbubble' ? 'Chat Messages' : activePanel}</h3>
                  <button onClick={()=>setActivePanel(null)} className="p-1 rounded hover:bg-neutral-100"><X size={14} className="text-neutral-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3">{renderPanelContent()}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="md:hidden flex items-center gap-0.5 px-1 py-1 bg-white border-t border-neutral-200 z-50 overflow-x-auto shrink-0">
        <MobileTool icon={<Type size={16}/>} label="Text" onClick={handleAddText} />
        <MobileTool icon={<ImageIcon size={16}/>} label="Photo" onClick={handleAddImage} />
        <MobileTool icon={<MessageSquare size={16}/>} label="Chat" active={activePanel==='chatbubble'} onClick={()=>setActivePanel(p=>p==='chatbubble'?null:'chatbubble')} />
        <MobileTool icon={<StickyNote size={16}/>} label="Note" active={activePanel==='note'} onClick={()=>setActivePanel(p=>p==='note'?null:'note')} />
        <MobileTool icon={<Smile size={16}/>} label="Sticker" active={activePanel==='sticker'} onClick={()=>setActivePanel(p=>p==='sticker'?null:'sticker')} />
        <MobileTool icon={<Calendar size={16}/>} label="Date" onClick={handleAddDateStamp} />
        <MobileTool icon={<Tag size={16}/>} label="Washi" active={activePanel==='washi'} onClick={()=>setActivePanel(p=>p==='washi'?null:'washi')} />
        <MobileTool icon={<Palette size={16}/>} label="Theme" active={activePanel==='theme'} onClick={()=>setActivePanel(p=>p==='theme'?null:'theme')} />
      </div>

      <AnimatePresence>
        {activePanel && (
          <motion.div initial={{ height: 0 }} animate={{ height: '45dvh' }} exit={{ height: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="md:hidden fixed bottom-[49px] left-0 right-0 bg-white border-t border-neutral-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-700 text-sm capitalize">{activePanel === 'chatbubble' ? 'Chat Messages' : activePanel}</h3>
              <button onClick={()=>setActivePanel(null)} className="p-1 rounded hover:bg-neutral-100"><X size={14} className="text-neutral-400"/></button>
            </div>
            <div className="overflow-y-auto p-3 h-[calc(100%-40px)]">{renderPanelContent()}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedElement && !activePanel && (
          <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} className="fixed bottom-14 left-3 right-3 md:hidden bg-white rounded-2xl shadow-xl border border-neutral-200 z-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-400 capitalize">{selectedElement.type}</span>
              <div className="flex items-center gap-1">
                <button onClick={()=>setShowProps(p=>!p)} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"><Settings size={15}/></button>
                <button onClick={()=>duplicateElement(selectedId)} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"><Copy size={15}/></button>
                <button onClick={()=>deleteElement(selectedId)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15}/></button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <RotateCw size={12} className="text-neutral-400 shrink-0"/>
                <input type="range" min={-180} max={180} value={Math.round(selectedElement.rotation||0)} onChange={e=>updateElementImmediate(selectedId,{rotation:+e.target.value})} className="flex-1 accent-neutral-800" />
                <span className="text-[10px] text-neutral-400 w-8">{Math.round(selectedElement.rotation||0)}°</span>
              </div>
            </div>
            <AnimatePresence>
              {showProps && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-2 mt-2 border-t border-neutral-100 space-y-2">
                    {(selectedElement.type==='text'||selectedElement.type==='note') && (
                      <>
                        <select value={selectedElement.fontFamily||"'Inter', sans-serif"} onChange={e=>updateElementImmediate(selectedId,{fontFamily:e.target.value})} className="w-full text-xs border border-neutral-200 rounded-lg px-2 py-1.5">
                          {FONTS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        <div className="flex gap-1.5">
                          <label className="relative shrink-0"><input type="color" value={selectedElement.color||'#2a2a2a'} onChange={e=>updateElementImmediate(selectedId,{color:e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/><div className="w-8 h-8 rounded-lg border border-neutral-200" style={{backgroundColor:selectedElement.color||'#2a2a2a'}}/></label>
                          <input type="number" value={selectedElement.fontSize||18} onChange={e=>updateElementImmediate(selectedId,{fontSize:Math.max(8,+e.target.value||12)})} className="w-16 text-xs border border-neutral-200 rounded-lg px-2 py-1.5" min={8} max={120}/>
                          <button onClick={()=>updateElementImmediate(selectedId,{fontWeight:selectedElement.fontWeight==='bold'?'normal':'bold'})} className={cx('p-2 rounded-lg',selectedElement.fontWeight==='bold'?'bg-neutral-200':'hover:bg-neutral-100')}><Bold size={14}/></button>
                          <button onClick={()=>updateElementImmediate(selectedId,{fontStyle:selectedElement.fontStyle==='italic'?'normal':'italic'})} className={cx('p-2 rounded-lg',selectedElement.fontStyle==='italic'?'bg-neutral-200':'hover:bg-neutral-100')}><Italic size={14}/></button>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-1.5"><span className="text-[11px] text-neutral-400">Opacity</span><input type="range" min={0.1} max={1} step={0.05} value={selectedElement.opacity??1} onChange={e=>updateElementImmediate(selectedId,{opacity:+e.target.value})} className="flex-1 accent-neutral-800"/></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedElement && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border-t border-neutral-200 z-50 shrink-0 overflow-x-auto">
          <button onClick={()=>deleteElement(selectedId)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 shrink-0"><Trash2 size={14}/></button>
          <button onClick={()=>duplicateElement(selectedId)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 shrink-0"><Copy size={14}/></button>
          <button onClick={()=>updateElementImmediate(selectedId,{locked:!selectedElement.locked})} className={cx('p-1.5 rounded-lg shrink-0',selectedElement.locked?'bg-amber-50 text-amber-500':'hover:bg-neutral-100 text-neutral-400')}>{selectedElement.locked?<Lock size={14}/>:<Unlock size={14}/>}</button>
          <button onClick={()=>sendToBack(selectedId)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 shrink-0"><Layers size={14}/></button>
          <div className="w-px h-5 bg-neutral-200 shrink-0"/>
          {(selectedElement.type==='text'||selectedElement.type==='note')&&(
            <>
              <select value={selectedElement.fontFamily||"'Inter', sans-serif"} onChange={e=>updateElementImmediate(selectedId,{fontFamily:e.target.value})} className="text-xs border border-neutral-200 rounded-lg px-2 py-1 shrink-0">{FONTS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select>
              <label className="shrink-0 relative"><input type="color" value={selectedElement.color||'#2a2a2a'} onChange={e=>updateElementImmediate(selectedId,{color:e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/><div className="w-6 h-6 rounded-lg border border-neutral-200" style={{backgroundColor:selectedElement.color||'#2a2a2a'}}/></label>
              <input type="number" value={selectedElement.fontSize||18} onChange={e=>updateElementImmediate(selectedId,{fontSize:Math.max(8,+e.target.value||12)})} className="w-14 text-xs border border-neutral-200 rounded-lg px-2 py-1 shrink-0" min={8} max={120}/>
            </>
          )}
          <div className="flex items-center gap-1 shrink-0"><RotateCw size={11} className="text-neutral-400"/><input type="range" min={-180} max={180} value={Math.round(selectedElement.rotation||0)} onChange={e=>updateElementImmediate(selectedId,{rotation:+e.target.value})} className="w-16 accent-neutral-800"/><span className="text-[10px] text-neutral-400 w-7 font-mono">{Math.round(selectedElement.rotation||0)}°</span></div>
        </div>
      )}
    </div>
  );

  function renderPanelContent() {
    if (activePanel === 'note') return (
      <div>
        <p className="text-xs text-neutral-400 mb-2">Pick a color</p>
        <div className="grid grid-cols-4 gap-2">
          {NOTE_COLORS.map(c => <button key={c.bg} onClick={()=>handleAddNote(c)} className="aspect-square rounded-xl shadow-sm border-2 transition-transform hover:scale-105 active:scale-95" style={{backgroundColor:c.bg,borderColor:c.border}}/>)}
        </div>
      </div>
    );
    if (activePanel === 'sticker') return (
      <div className="space-y-3">
        {Object.entries(STICKER_CATEGORIES).map(([cat, emojis]) => (
          <div key={cat}><h4 className="text-[10px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">{cat}</h4><div className="grid grid-cols-6 gap-0.5">{emojis.map((e,i)=><button key={i} onClick={()=>handleAddSticker(e)} className="text-2xl p-1.5 rounded-lg hover:bg-neutral-50 hover:scale-125 active:scale-90 transition-all">{e}</button>)}</div></div>
        ))}
      </div>
    );
    if (activePanel === 'chatbubble') return (
      <div>
        {starredMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={28} className="mx-auto text-neutral-200 mb-2"/>
            <p className="text-sm text-neutral-400">No starred messages</p>
            <p className="text-xs text-neutral-300 mt-1">Star messages from your chats first (memory only, privacy-safe)</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mb-2">
              <p className="text-[11px] text-blue-600">🔒 Privacy: chats live in RAM only, never saved to disk. Blob images expire on refresh.</p>
            </div>
            <p className="text-xs text-neutral-400 mb-2">{starredMessages.length} starred • Tap to add</p>
            {starredMessages.map(msg => (
              <button key={msg.id} onClick={() => handleAddChatBubble(msg)} className="w-full text-left p-2.5 rounded-xl border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50 transition-all active:scale-[0.98]">
                <div className="flex flex-col items-end">
                  {msg.mediaUrl ? <img src={msg.mediaUrl} alt="" className="max-w-[140px] h-20 object-cover rounded-lg mb-1.5" onError={(e)=>{e.target.style.display='none';}}/> : null}
                  <div className="inline-block px-3 py-1.5 rounded-2xl rounded-br-sm text-sm" style={{backgroundColor: msg.isMine ? '#d9fdd3' : '#fff', border: msg.isMine ? 'none' : '1px solid #e5e5e5'}}>
                    <p className="text-neutral-700 line-clamp-2 text-[13px]">{msg.content}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{msg.sender}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
    if (activePanel === 'theme') return (
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(THEMES).map(([key, t]) => (
          <button key={key} onClick={()=>handleThemeChange(key)} className={cx('p-2 rounded-xl border-2 transition-all text-center',scrapbook.theme===key?'border-neutral-800 shadow-md':'border-neutral-100 hover:border-neutral-300')}>
            <div className="w-full h-9 rounded-lg mb-1 border border-neutral-200/50" style={{backgroundColor:t.bg}}/>
            <span className="text-xs font-medium text-neutral-600">{t.emoji} {t.label}</span>
          </button>
        ))}
      </div>
    );
    if (activePanel === 'washi') return (
      <div className="space-y-1.5">
        {WASHI_TAPES.map((tape,i)=><button key={i} onClick={()=>handleAddWashi(tape)} className="w-full h-9 rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] border border-neutral-200/50" style={{background:tape.bg,backgroundSize:tape.bgSize}}><span className="text-[11px] font-medium text-neutral-500 bg-white/60 px-2 py-0.5 rounded">{tape.label}</span></button>)}
      </div>
    );
    return null;
  }
}

function ToolBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} title={label} className={cx('w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all',active?'bg-neutral-100 text-neutral-800 shadow-sm':'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600')}>
      {icon}<span className="text-[8px] leading-none font-medium">{label}</span>
    </button>
  );
}
function MobileTool({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={cx('flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl shrink-0 transition-all',active?'bg-neutral-100 text-neutral-700':'text-neutral-400 active:bg-neutral-50')}>
      {icon}<span className="text-[9px] leading-none font-medium">{label}</span>
    </button>
  );
}
