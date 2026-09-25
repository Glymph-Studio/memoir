// Simple cn utility without external dependency
export function cx(...args) {
  let result = '';
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') result += (result ? ' ' : '') + arg;
    else if (Array.isArray(arg)) {
      const inner = cx(...arg);
      if (inner) result += (result ? ' ' : '') + inner;
    } else if (typeof arg === 'object') {
      for (const [k, v] of Object.entries(arg)) {
        if (v) result += (result ? ' ' : '') + k;
      }
    }
  }
  return result;
}

export function getAvatarColor(name) {
  const colors = [
    'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400',
    'bg-violet-400', 'bg-pink-400', 'bg-teal-400', 'bg-orange-400',
    'bg-indigo-400', 'bg-cyan-400',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getAvatarLetter(name) {
  return (name || '?').charAt(0).toUpperCase();
}

export function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const timeMatch = timestamp.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/);
  return timeMatch ? timeMatch[1] : timestamp;
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const dateMatch = timestamp.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  return dateMatch ? dateMatch[1] : timestamp;
}

export function getRandomThemeColor() {
  const colors = ['#f5e6d3', '#d4e6d4', '#d6e5f3', '#f5d6d6', '#f5e6c8', '#e6d4f0', '#f0e6d4', '#d4f0e6'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function truncate(str, len = 50) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}
