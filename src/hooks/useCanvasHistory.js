import { useState, useCallback, useRef } from 'react';

// Efficient clone - structuredClone if available, else JSON
function cloneElements(els) {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(els); } catch {}
  }
  return JSON.parse(JSON.stringify(els));
}

export function useCanvasHistory(initial = [], maxSize = 50) {
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const batchRef = useRef(null); // for batching drag operations

  const pushHistory = useCallback((els) => {
    if (!els) return;
    // Avoid pushing duplicate
    setHistory(prev => {
      const next = [...prev, cloneElements(els)];
      if (next.length > maxSize) return next.slice(-maxSize);
      return next;
    });
    setRedoStack([]);
  }, [maxSize]);

  const undo = useCallback((current) => {
    if (history.length === 0) return null;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setRedoStack(r => [...r, cloneElements(current)]);
    return prev;
  }, [history]);

  const redo = useCallback((current) => {
    if (redoStack.length === 0) return null;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(r => r.slice(0, -1));
    setHistory(h => {
      const n = [...h, cloneElements(current)];
      return n.length > maxSize ? n.slice(-maxSize) : n;
    });
    return next;
  }, [redoStack, maxSize]);

  const clear = useCallback(() => {
    setHistory([]);
    setRedoStack([]);
  }, []);

  return { history, redoStack, pushHistory, undo, redo, clear, canUndo: history.length > 0, canRedo: redoStack.length > 0 };
}
