import { useState, useEffect, useRef, memo } from 'react';
import { RotateCw, ImageOff } from 'lucide-react';
import { cx } from '../../lib/utils';

const BUBBLE_PRESETS = {
  whatsapp: { mineBg: '#d9fdd3', otherBg: '#ffffff', mineColor: '#1a1a1a', otherColor: '#1a1a1a', radius: '12px', mineTail: true, otherTail: true, shadow: '0 1px 1px rgba(0,0,0,0.06)', border: 'none', timeInside: true },
  imessage: { mineBg: '#007aff', otherBg: '#e9e9eb', mineColor: '#ffffff', otherColor: '#1a1a1a', radius: '18px', mineTail: false, otherTail: false, shadow: 'none', border: 'none', timeInside: false },
  minimal: { mineBg: '#f0f0f0', otherBg: '#ffffff', mineColor: '#333', otherColor: '#333', radius: '4px', mineTail: false, otherTail: false, shadow: 'none', border: '1px solid #e5e5e5', timeInside: false },
  vintage: { mineBg: '#f5e6d3', otherBg: '#ffffff', mineColor: '#5a4a3a', otherColor: '#4a4a4a', radius: '2px', mineTail: false, otherTail: false, shadow: '2px 2px 6px rgba(0,0,0,0.08)', border: '1px solid #d4c4a8', timeInside: true },
  scrapbook: { mineBg: '#fef3c7', otherBg: '#e0e7ff', mineColor: '#92400e', otherColor: '#3730a3', radius: '8px', mineTail: false, otherTail: false, shadow: '2px 3px 8px rgba(0,0,0,0.1)', border: 'none', timeInside: true },
  polaroid: { mineBg: '#ffffff', otherBg: '#ffffff', mineColor: '#333', otherColor: '#333', radius: '2px', mineTail: false, otherTail: false, shadow: '3px 4px 12px rgba(0,0,0,0.15)', border: '1px solid #eee', timeInside: true },
};

function CanvasElementInner({ element: el, isSelected, isEditing, onPointerDown, onResizeStart, onRotateStart, onUpdate, onStopEditing }) {
  const [editContent, setEditContent] = useState('');
  const [imgError, setImgError] = useState(false);
  const textRef = useRef();

  useEffect(() => {
    if (isEditing) {
      setEditContent(el.content || '');
      setTimeout(() => textRef.current?.focus(), 50);
    }
  }, [isEditing, el.id]);

  // Reset imgError when src changes
  useEffect(() => { setImgError(false); }, [el.src, el.mediaUrl]);

  const stopEdit = () => {
    if (editContent !== el.content) onUpdate({ content: editContent });
    onStopEditing();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopEdit();
    }
    e.stopPropagation();
  };

  const renderContent = () => {
    switch (el.type) {
      case 'text':
        return (
          <div className="w-full h-full overflow-hidden p-2" style={{ fontFamily: el.fontFamily, fontSize: `${el.fontSize || 18}px`, color: el.color || '#2a2a2a', fontWeight: el.fontWeight || 'normal', fontStyle: el.fontStyle || 'normal', textAlign: el.textAlign || 'left', lineHeight: 1.5 }}>
            {isEditing ? (
              <textarea ref={textRef} value={editContent} onChange={e => setEditContent(e.target.value)} onBlur={stopEdit} onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent border-none outline-none resize-none"
                style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', textAlign: 'inherit', lineHeight: 'inherit' }}
                onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={e => e.stopPropagation()} />
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words">{el.content}</p>
                {el.fromStarred && <p className="text-xs opacity-40 mt-1" style={{ fontSize: '12px' }}>— {el.sender}</p>}
              </>
            )}
          </div>
        );
      case 'image':
        if (imgError || !el.src) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 rounded-sm text-neutral-400">
              <ImageOff size={20} className="mb-1" />
              <span className="text-[10px]">Image failed</span>
              {el.originalName && <span className="text-[8px] truncate max-w-[80%]">{el.originalName}</span>}
            </div>
          );
        }
        return (
          <img 
            src={el.src} 
            alt={el.originalName || ""} 
            className="w-full h-full object-cover rounded-sm pointer-events-none" 
            draggable={false} 
            loading="eager"
            onError={() => setImgError(true)}
          />
        );
      case 'note':
        return (
          <div className="w-full h-full p-3 overflow-hidden relative" style={{ backgroundColor: el.noteBg || '#fef9c3', border: `2px solid ${el.noteBorder || '#fde047'}`, borderRadius: '4px', boxShadow: '3px 3px 10px rgba(0,0,0,0.08)' }}>
            {isEditing ? (
              <textarea ref={textRef} value={editContent} onChange={e => setEditContent(e.target.value)} onBlur={stopEdit} onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent border-none outline-none resize-none"
                style={{ fontFamily: "'Caveat', cursive", fontSize: `${el.fontSize || 20}px`, lineHeight: 1.6, color: el.color || '#333' }}
                onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={e => e.stopPropagation()} />
            ) : (
              <p className="whitespace-pre-wrap break-words" style={{ fontFamily: "'Caveat', cursive", fontSize: `${el.fontSize || 20}px`, lineHeight: 1.6, color: el.color || '#333' }}>
                {el.content || 'Tap to write...'}
              </p>
            )}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 shadow-sm border border-red-500" />
            <div className="absolute bottom-0 right-0 w-5 h-5" style={{ background: `linear-gradient(225deg, transparent 50%, ${el.noteBorder || '#fde047'}99 50%)` }} />
          </div>
        );
      case 'sticker':
        return <div className="w-full h-full flex items-center justify-center select-none" style={{ fontSize: `${Math.min(el.w, el.h) * 0.7}px` }}>{el.content}</div>;
      case 'washi':
        return <div className="w-full h-full rounded-sm" style={{ background: el.washiBg, backgroundSize: el.washiBgSize || 'auto', opacity: 0.85, borderRadius: '2px' }} />;
      case 'datestamp':
        return (
          <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-md px-3" style={{ borderColor: el.color || '#555', opacity: 0.7 }}>
            <span style={{ fontFamily: el.fontFamily || "'Playfair Display', serif", fontSize: `${el.fontSize || 16}px`, color: el.color || '#555', letterSpacing: '1px' }}>📅 {el.content}</span>
          </div>
        );
      case 'chatbubble':
        return renderChatBubble();
      default: return null;
    }
  };

  const renderChatBubble = () => {
    const preset = BUBBLE_PRESETS[el.bubbleStyle] || BUBBLE_PRESETS.whatsapp;
    const isMine = el.isMine;
    const bgColor = isMine ? (el.mineBg || preset.mineBg) : (el.otherBg || preset.otherBg);
    const textColor = isMine ? (el.mineColor || preset.mineColor) : (el.otherColor || preset.otherColor);
    const showSender = el.showSender !== false;
    const showTime = el.showTime !== false;
    const hasMedia = el.mediaUrl && !imgError;

    return (
      <div className="w-full h-full flex flex-col p-2 overflow-hidden">
        {hasMedia && (
          <div className="mb-1.5 rounded-lg overflow-hidden" style={{ maxHeight: '55%' }}>
            <img src={el.mediaUrl} alt="" className="w-full object-cover rounded-lg" loading="eager" onError={() => setImgError(true)} />
          </div>
        )}
        {imgError && el.mediaUrl && (
          <div className="mb-1.5 p-2 bg-neutral-100 rounded-lg flex items-center gap-1 text-[10px] text-neutral-400">
            <ImageOff size={12} /> Media expired (privacy: blob URLs don't persist)
          </div>
        )}
        <div className={cx('flex flex-col', isMine ? 'items-end' : 'items-start')}>
          {showSender && !isMine && (
            <span className="text-[10px] font-semibold text-neutral-400 mb-0.5 px-1">{el.sender}</span>
          )}
          <div className="inline-block px-3 py-1.5 relative" style={{ backgroundColor: bgColor, color: textColor, borderRadius: preset.radius, boxShadow: preset.shadow, border: preset.border, maxWidth: '100%', wordBreak: 'break-word' }}>
            <p className="text-[13px] leading-snug whitespace-pre-wrap" style={{ fontFamily: el.bubbleStyle === 'scrapbook' ? "'Caveat', cursive" : el.bubbleStyle === 'vintage' ? 'Georgia, serif' : 'inherit', fontSize: el.bubbleStyle === 'polaroid' ? '12px' : '13px' }}>
              {el.content}
            </p>
            {showTime && preset.timeInside && (
              <span className="block text-right text-[9px] opacity-40 mt-0.5">{el.timestamp || 'now'}</span>
            )}
            {isMine && preset.mineTail && (
              <div className="absolute -right-1 bottom-0 w-3 h-3 overflow-hidden"><div className="w-3 h-3 rounded-sm rotate-45 translate-y-0.5" style={{ backgroundColor: bgColor }} /></div>
            )}
            {!isMine && preset.otherTail && (
              <div className="absolute -left-1 bottom-0 w-3 h-3 overflow-hidden"><div className="w-3 h-3 rounded-sm rotate-45 translate-y-0.5" style={{ backgroundColor: bgColor }} /></div>
            )}
          </div>
          {showTime && !preset.timeInside && (
            <span className="text-[9px] text-neutral-300 mt-0.5 px-1">{el.timestamp || 'now'}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cx(
        'absolute touch-none will-change-transform',
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : '',
        isEditing ? '' : 'cursor-grab active:cursor-grabbing',
        el.locked ? 'cursor-not-allowed' : '',
      )}
      style={{ left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.rotation || 0}deg)`, zIndex: el.zIndex || 1, opacity: el.opacity ?? 1 }}
      onPointerDown={isEditing ? undefined : onPointerDown}
      onTouchStart={isEditing ? undefined : onPointerDown}
    >
      {renderContent()}
      {isSelected && !el.locked && (
        <>
          {['tl', 'tr', 'bl', 'br'].map(corner => {
            const s = { position: 'absolute', width: 12, height: 12, backgroundColor: 'white', border: '2px solid #3b82f6', borderRadius: '50%', zIndex: 10 };
            if (corner.includes('l')) s.left = -6; else s.right = -6;
            if (corner.includes('t')) s.top = -6; else s.bottom = -6;
            s.cursor = corner === 'tl' ? 'nw-resize' : corner === 'tr' ? 'ne-resize' : corner === 'bl' ? 'sw-resize' : 'se-resize';
            return <div key={corner} style={s} className="canvas-ctrl" onPointerDown={e => onResizeStart(e, el.id, corner)} />;
          })}
          <div className="absolute canvas-ctrl" style={{ top: -30, left: '50%', transform: 'translateX(-50%)', width: 20, height: 20, backgroundColor: 'white', border: '2px solid #3b82f6', borderRadius: '50%', zIndex: 10, cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onPointerDown={e => onRotateStart(e, el.id)}>
            <RotateCw size={10} className="text-blue-500" />
          </div>
          <div className="absolute canvas-ctrl" style={{ top: -18, left: '50%', width: 1, height: 18, backgroundColor: '#3b82f6', zIndex: 9 }} />
        </>
      )}
    </div>
  );
}

export const CanvasElement = memo(CanvasElementInner, (prev, next) => {
  return (
    prev.element === next.element &&
    prev.isSelected === next.isSelected &&
    prev.isEditing === next.isEditing &&
    prev.onPointerDown === next.onPointerDown &&
    prev.onResizeStart === next.onResizeStart &&
    prev.onRotateStart === next.onRotateStart &&
    prev.onUpdate === next.onUpdate &&
    prev.onStopEditing === next.onStopEditing
  );
});

export { BUBBLE_PRESETS };
