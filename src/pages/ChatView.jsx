import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Search, ChevronUp, ChevronDown, X, Image as ImageIcon, ImageOff, StarOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChats, getMessages, getStarredMessages, saveStarredMessages, generateId } from '../lib/storage';
import { formatMessageTime, cx } from '../lib/utils';

const PAGE_SIZE = 80;

function openMedia(url) {
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (popup) popup.opener = null;
}

// Helper: blob URL -> dataURL for persistent starring
async function blobToDataURL(blobUrl) {
  try {
    const res = await fetch(blobUrl);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function ChatView() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef();
  const listRef = useRef();
  const messageRefs = useRef(new Map());

  const [chat, setChat] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [starredMessages, setStarredMessages] = useState([]);
  const [starredIds, setStarredIds] = useState(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatch, setActiveMatch] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState(new Set());
  const [starring, setStarring] = useState(null);
  const [activeMessageId, setActiveMessageId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const chats = await getChats(user.id);
        const found = chats.find(c => c.id === chatId);
        if (!found) {
          navigate('/', { state: { privacy: true } });
          return;
        }
        if (!mounted) return;
        setChat(found);
        const msgs = await getMessages(user.id, chatId);
        if (!mounted) return;
        setAllMessages(msgs);
        const starred = await getStarredMessages(user.id);
        if (!mounted) return;
        setStarredMessages(starred);
        setStarredIds(new Set(starred.map(s => s.messageId)));
        setLoading(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
      } catch (e) {
        console.error('[ChatView] Load failed', e);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [chatId, user.id, navigate]);

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return allMessages
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => String(message.content || '').toLowerCase().includes(query));
  }, [allMessages, searchQuery]);

  useEffect(() => {
    setActiveMatch(searchMatches.length ? searchMatches.length - 1 : 0);
  }, [searchQuery, searchMatches.length]);

  const targetIndex = searchMatches[activeMatch]?.index;
  const visibleMessages = useMemo(() => {
    if (searchQuery.trim() && Number.isInteger(targetIndex)) {
      const start = Math.max(0, targetIndex - 12);
      const end = Math.min(allMessages.length, targetIndex + 13);
      return allMessages.slice(start, end);
    }
    return allMessages.slice(-visibleCount);
  }, [allMessages, visibleCount, searchQuery, targetIndex]);

  const hasMore = !searchQuery.trim() && allMessages.length > visibleMessages.length;

  useEffect(() => {
    if (!searchQuery.trim() || !Number.isInteger(targetIndex)) return;
    requestAnimationFrame(() => {
      const list = listRef.current;
      const target = messageRefs.current.get(allMessages[targetIndex]?.id);
      if (!list || !target) return;
      const top = target.offsetTop - list.clientHeight / 2 + target.clientHeight / 2;
      list.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  }, [targetIndex, searchQuery, allMessages]);

  const handleScroll = useCallback((event) => {
    if (event.currentTarget.scrollTop < 100 && hasMore) {
      setVisibleCount(count => Math.min(count + PAGE_SIZE, allMessages.length));
    }
  }, [hasMore, allMessages.length]);

  const moveMatch = (direction) => {
    if (!searchMatches.length) return;
    setActiveMatch(current => (current + direction + searchMatches.length) % searchMatches.length);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveMatch(0);
    setVisibleCount(PAGE_SIZE);
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const toggleStar = async (msg) => {
    setStarring(msg.id);
    try {
      const updated = [...starredMessages];
      const existingIdx = updated.findIndex(s => s.messageId === msg.id);

      if (existingIdx >= 0) {
        updated.splice(existingIdx, 1);
      } else {
        let persistentMediaUrl = msg.mediaUrl;
        // If media is blob URL, convert to dataURL for persistence in scrapbook (user explicitly starred = consent)
        if (msg.mediaUrl && msg.mediaUrl.startsWith('blob:')) {
          const dataUrl = await blobToDataURL(msg.mediaUrl);
          if (dataUrl) persistentMediaUrl = dataUrl;
        }

        updated.push({
          id: generateId(),
          messageId: msg.id,
          chatId,
          contactName: chat?.contactName || 'Unknown',
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
          isMine: msg.isMine,
          mediaUrl: persistentMediaUrl,
          originalBlobUrl: msg.mediaUrl, // Keep original for reference
          mediaType: msg.mediaType,
          isMedia: msg.isMedia,
          starredAt: new Date().toISOString(),
        });
      }

      setStarredMessages(updated);
      await saveStarredMessages(user.id, updated);
      setStarredIds(new Set(updated.map(s => s.messageId)));
    } catch (e) {
      console.error('Star failed', e);
    } finally {
      setStarring(null);
    }
  };

  const mediaMessages = useMemo(() => allMessages.filter(m => m.isMedia || m.mediaUrl), [allMessages]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)] items-center justify-center">
        <div className="w-6 h-6 border-2 border-memoir-200 border-t-memoir-500 rounded-full animate-spin mb-3" />
        <p className="text-sm text-memoir-400">Loading messages...</p>
        <p className="text-xs text-emerald-600 mt-1">🔒 Privacy: memory-only • Images starrable</p>
      </div>
    );
  }

  if (!chat) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-memoir-100 bg-white/80 backdrop-blur-lg sticky top-16 z-30">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-memoir-50 transition-colors">
          <ArrowLeft size={20} className="text-memoir-600" />
        </button>
        <div className={cx('w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold', chat.avatarColor || 'bg-memoir-400')}>{chat.avatarLetter || '?'}</div>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-memoir-800 truncate flex items-center gap-1.5">{chat.contactName}</h2>
          <p className="text-xs text-memoir-400">{allMessages.length} messages  {starredIds.size} starred</p>
        </div>
      </div>

      <div className="px-3 py-2 bg-white border-b border-memoir-100 flex items-center gap-2">
        <Search size={17} className="text-amber-500 shrink-0" />
        <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search conversation" className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-memoir-300 focus:outline-none" />
        {searchQuery && (
          <>
            <span className="text-xs tabular-nums text-memoir-400 whitespace-nowrap">{searchMatches.length ? `${activeMatch + 1} of ${searchMatches.length}` : '0 results'}</span>
            <button onClick={() => moveMatch(-1)} disabled={!searchMatches.length} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-memoir-50 disabled:opacity-30" aria-label="Previous result"><ChevronUp size={18} /></button>
            <button onClick={() => moveMatch(1)} disabled={!searchMatches.length} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-memoir-50 disabled:opacity-30" aria-label="Next result"><ChevronDown size={18} /></button>
            <button onClick={clearSearch} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-memoir-50" aria-label="Close search"><X size={17} /></button>
          </>
        )}
      </div>

      {true ? (
        <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {hasMore && !searchQuery && (
            <div className="text-center py-2">
              <button onClick={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, allMessages.length))} className="text-xs text-memoir-400 hover:text-memoir-600 bg-white px-3 py-1 rounded-full border border-memoir-100">Load {Math.min(PAGE_SIZE, allMessages.length - visibleMessages.length)} earlier • {allMessages.length - visibleMessages.length} left</button>
            </div>
          )}
          {visibleMessages.length === 0 ? (
            <div className="text-center py-12"><p className="text-memoir-400">{searchQuery ? `No results for "${searchQuery}"` : 'No messages'}</p></div>
          ) : (
            visibleMessages.map((msg, i) => (
              <div
                key={msg.id}
                ref={node => { if (node) messageRefs.current.set(msg.id, node); else messageRefs.current.delete(msg.id); }}
                className={cx('flex scroll-m-24 rounded-xl transition-colors', msg.id === allMessages[targetIndex]?.id && 'bg-amber-100/70 py-1', msg.isMine ? 'justify-end' : 'justify-start')}
              >
                <div onClick={() => setActiveMessageId(current => current === msg.id ? null : msg.id)} className={cx('max-w-[80%] px-4 py-2.5 relative group', msg.isMine ? 'chat-bubble-mine' : 'chat-bubble-other')}>
                  {!msg.isMine && visibleMessages[i-1]?.sender !== msg.sender && <p className={cx('text-xs font-medium mb-1', msg.isMine ? 'text-memoir-100' : 'text-memoir-400')}>{msg.sender}</p>}
                  
                  {msg.mediaUrl && !imgErrors.has(msg.id) && (
                    <div className="mb-2 rounded-lg overflow-hidden relative group/img">
                      <img src={msg.mediaUrl} alt="Media" className="max-w-full rounded-lg cursor-pointer" loading="eager" onError={() => setImgErrors(prev => new Set([...prev, msg.id]))} onClick={() => openMedia(msg.mediaUrl)} />
                      {/* Star button for images */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(msg); }}
                        className={cx('absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-md border transition-all', starredIds.has(msg.id) ? 'text-amber-400 border-amber-200' : 'text-neutral-400 border-neutral-200 opacity-0 group-hover/img:opacity-100')}
                      >
                        {starring === msg.id ? <div className="w-3 h-3 border-2 border-amber-300 border-t-amber-500 rounded-full animate-spin" /> : <Star size={14} className={starredIds.has(msg.id) ? 'fill-amber-400' : ''} />}
                      </button>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={cx('text-[10px] mt-1 text-right', msg.isMine ? 'text-white/60' : 'text-memoir-300')}>{formatMessageTime(msg.timestamp)}</p>
                  
                  <button aria-label={starredIds.has(msg.id) ? 'Unstar message' : 'Star message'} onClick={(event) => { event.stopPropagation(); toggleStar(msg); }} className={cx('absolute -right-2 -top-2 w-9 h-9 md:w-7 md:h-7 rounded-full flex items-center justify-center opacity-0 pointer-events-none md:pointer-events-auto md:group-hover:opacity-100 transition-all duration-200 bg-white shadow-md border border-memoir-100', (activeMessageId === msg.id || starredIds.has(msg.id) || starring === msg.id) && 'opacity-100 pointer-events-auto text-amber-400')}>
                    {starring === msg.id ? <div className="w-3 h-3 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" /> : <Star size={14} className={starredIds.has(msg.id) ? 'fill-amber-400 text-amber-400' : 'text-memoir-300'} />}
                  </button>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex gap-2">
            <Star size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-800">Star images to add to scrapbook</p>
            </div>
          </div>

          {mediaMessages.length === 0 ? (
            <div className="text-center py-12"><ImageIcon size={40} className="mx-auto text-memoir-200 mb-3" /><p className="text-memoir-400">No media found</p></div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {mediaMessages.map((msg) => (
                <div key={msg.id} className="aspect-square rounded-xl overflow-hidden bg-memoir-50 cursor-pointer group relative border-2 border-transparent hover:border-memoir-200">
                  {msg.mediaUrl && !imgErrors.has(msg.id) ? (
                    <>
                      <img src={msg.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="eager" onError={() => setImgErrors(prev => new Set([...prev, msg.id]))} onClick={() => openMedia(msg.mediaUrl)} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(msg); }}
                        className={cx('absolute top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg border-2 transition-all', starredIds.has(msg.id) ? 'bg-amber-400 border-amber-300 text-white' : 'bg-white/90 border-white text-neutral-400 hover:text-amber-500')}
                      >
                        {starring === msg.id ? <div className="w-4 h-4 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" /> : starredIds.has(msg.id) ? <StarOff size={16} /> : <Star size={16} />}
                      </button>
                      <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {msg.sender} • {formatMessageTime(msg.timestamp)}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1"><ImageOff size={20} className="text-memoir-300" /><span className="text-[9px] text-memoir-400">Expired</span></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
