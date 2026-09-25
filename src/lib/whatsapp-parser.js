/* ============================================
   WhatsApp Chat Export Parser v2
   - 12+ date formats, robust multiline, media linking
   - Progress callback, memory-safe for large files
   ============================================ */

import { generateId } from './storage';

const SYSTEM_PHRASES = [
  'Messages and calls are end-to-end encrypted',
  'created group',
  'added you',
  'removed you',
  'changed the subject',
  'changed this group',
  'changed the group description',
  'changed their phone number',
  'security code changed',
  'You were added',
  'image omitted',
  'This message was deleted',
  'You deleted this message',
];

/**
 * Robust WhatsApp patterns
 * Supports: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD, DD.MM.YY, DD/MM/YY
 * With comma or space, with seconds, with AM/PM, with brackets, with unicode dash
 */
const DATE_PATTERNS = [
  // 12/05/2023, 10:30 pm - Name: msg  (most common IN)
  { regex: /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*[-\u2013\u2014]\s*([^:]+?):\s*(.*)/, ts: 1, sender: 2, msg: 3 },
  // [12/05/23, 10:30:45 pm] Name: msg  (iOS bracket format)
  { regex: /^\[(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s*([^:]+?):\s*(.*)/, ts: 1, sender: 2, msg: 3 },
  // 2023-05-12, 10:30 - Name: msg
  { regex: /^(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2},?\s+\d{1,2}:\d{2}(?::\d{2})?)\s*[-\u2013\u2014]\s*([^:]+?):\s*(.*)/, ts: 1, sender: 2, msg: 3 },
  // [2023-05-12, 10:30:00] Name: msg
  { regex: /^\[(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2},?\s+\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+?):\s*(.*)/, ts: 1, sender: 2, msg: 3 },
  // 12.05.23, 10:30 - Name: msg (German)
  { regex: /^(\d{1,2}\.\d{1,2}\.\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?)\s*[-\u2013\u2014]\s*([^:]+?):\s*(.*)/, ts: 1, sender: 2, msg: 3 },
  // Fallback: anything like timestamp - sender: content with more permissive sender
  { regex: /^(.+?)\s*-\s*([^:]{1,40}?):\s*(.*)$/, ts: 1, sender: 2, msg: 3, validateTs: true },
];

function looksLikeTimestamp(str) {
  if (!str) return false;
  // Must contain date-like numbers and time
  return /\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}/.test(str) || /\d{1,2}:\d{2}/.test(str);
}

function isSystemMessage(sender, content) {
  const combined = `${sender} ${content}`.toLowerCase();
  return SYSTEM_PHRASES.some(p => combined.includes(p.toLowerCase()));
}

export function parseWhatsAppText(text, onProgress) {
  const messages = [];
  const lines = text.split(/\r?\n/);
  const total = lines.length;
  let participants = new Set();
  let currentSender = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    if (onProgress && i % 1000 === 0) {
      onProgress(Math.round((i / total) * 100));
    }

    let parsed = false;

    for (const pat of DATE_PATTERNS) {
      const match = line.match(pat.regex);
      if (!match) continue;
      if (pat.validateTs && !looksLikeTimestamp(match[pat.ts])) continue;

      const timestamp = (match[pat.ts] || '').trim();
      const sender = (match[pat.sender] || '').trim();
      const content = (match[pat.msg] || '').trim();

      if (!sender || sender.length > 50) continue;
      if (isSystemMessage(sender, content)) {
        parsed = true;
        break;
      }

      participants.add(sender);
      currentSender = sender;

      // Media detection - expanded
      const lowerContent = content.toLowerCase();
      const isMedia =
        content === '<Media omitted>' ||
        lowerContent.includes('<media omitted>') ||
        lowerContent.includes('image omitted') ||
        /^(IMG|VID|AUD|PTT|STK)-\d+/.test(content) ||
        /\.(jpg|jpeg|png|webp|mp4|mov|opus|ogg|mp3|pdf|doc)/i.test(content) && content.length < 80;

      let mediaType = null;
      if (isMedia) {
        if (/IMG|image|jpg|jpeg|png|webp/i.test(content)) mediaType = 'image';
        else if (/VID|video|mp4|mov/i.test(content)) mediaType = 'video';
        else if (/AUD|audio|opus|mp3|voice/i.test(content)) mediaType = 'audio';
        else if (/STK|sticker/i.test(content)) mediaType = 'sticker';
        else if (/\.pdf|\.doc/i.test(content)) mediaType = 'document';
        else mediaType = 'image';
      }

      messages.push({
        id: generateId(),
        sender,
        content: isMedia ? content : content,
        timestamp,
        isMedia,
        mediaType,
        mediaUrl: null,
        rawLine: line.substring(0, 200),
      });

      parsed = true;
      break;
    }

    // Continuation line
    if (!parsed && currentSender && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (line.trim() && !looksLikeTimestamp(line.substring(0, 30))) {
        last.content += '\n' + line.trim();
      }
    }
  }

  return { messages, participants: [...participants] };
}

// ---- Zip handling v2 ----
export async function processChatFile(file, onProgress) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.zip')) {
    return await processZipFile(file, onProgress);
  } else if (name.endsWith('.txt')) {
    return await processTxtFile(file, onProgress);
  } else {
    throw new Error('Unsupported file format. Please upload a .txt or .zip file.');
  }
}

async function processTxtFile(file, onProgress) {
  // For large files, read as text but chunked progress
  const text = await file.text();
  const { messages, participants } = parseWhatsAppText(text, onProgress);

  const contactName = file.name
    .replace(/\.txt$/i, '')
    .replace(/WhatsApp Chat with /i, '')
    .replace(/_/g, ' ')
    .trim();

  return {
    contactName: contactName || participants[0] || 'Unknown Contact',
    messages,
    participants,
    mediaFiles: {},
  };
}

async function processZipFile(file, onProgress) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const result = {
    contactName: '',
    messages: [],
    participants: [],
    mediaFiles: {},
    mediaBlobs: {}, // key -> blob URL
  };

  // Find chat file - prioritize largest txt
  let chatFile = null;
  let maxSize = 0;
  const mediaEntries = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const lower = path.toLowerCase();
    if (lower.endsWith('.txt')) {
      // Estimate size, pick largest as main chat
      if (path.length > 0) {
        const size = entry._data ? entry._data.uncompressedSize || 0 : 0;
        if (size >= maxSize) {
          maxSize = size;
          chatFile = entry;
        }
        if (!chatFile) chatFile = entry;
      }
    } else if (/\.(jpg|jpeg|png|gif|webp|mp4|mov|opus|ogg|mp3|pdf)$/i.test(lower)) {
      mediaEntries.push({ path, entry });
    }
  }

  if (!chatFile) throw new Error('No chat .txt file found in zip. Make sure it contains WhatsApp export.');

  const text = await chatFile.async('string');
  const { messages, participants } = parseWhatsAppText(text, onProgress);

  // Extract media as object URLs, but limit to 100 files to avoid memory explosion
  const limitedMedia = mediaEntries.slice(0, 150);
  for (let i = 0; i < limitedMedia.length; i++) {
    const { path, entry } = limitedMedia[i];
    try {
      if (onProgress) onProgress(90 + Math.round((i / limitedMedia.length) * 10));
      const blob = await entry.async('blob');
      const url = URL.createObjectURL(blob);
      const fileName = path.split('/').pop();
      const baseName = fileName.replace(/\.[^.]+$/, '');
      result.mediaFiles[fileName] = url;
      result.mediaFiles[baseName] = url; // also index without ext for matching
      result.mediaBlobs[fileName] = { url, blob, path };
    } catch (e) {
      console.warn('Media extract failed', path, e);
    }
  }

  // Smart media linking: match by exact filename in message, then by timestamp proximity
  const mediaByName = result.mediaFiles;
  for (const msg of messages) {
    if (!msg.isMedia) continue;
    const content = msg.content;

    // Try exact filename match
    let matched = null;
    for (const [key, url] of Object.entries(mediaByName)) {
      if (content.includes(key) || key.includes(content.replace(/<|>/g, '').trim().substring(0, 20))) {
        matched = url;
        break;
      }
    }

    // Fallback: if message says IMG-20230512-WA0001.jpg, look for that exact
    if (!matched) {
      const fileMatch = content.match(/(IMG|VID|AUD|PTT|STK)[-_]\d+[-_]?WA?\d*\.\w+/i);
      if (fileMatch) {
        const name = fileMatch[0];
        matched = mediaByName[name] || mediaByName[name.split('.')[0]];
      }
    }

    if (matched) {
      msg.mediaUrl = matched;
      // Clean content for display
      if (msg.content.length < 60) msg.content = '📷 Photo';
    }
  }

  const contactName = chatFile.name
    .split('/').pop()
    .replace(/\.txt$/i, '')
    .replace(/WhatsApp Chat with /i, '')
    .replace(/_/g, ' ')
    .trim();

  result.contactName = contactName || participants[0] || 'Unknown Contact';
  result.messages = messages;
  result.participants = participants;

  return result;
}

export function determineMyMessages(messages, contactName) {
  if (!messages.length) return messages;
  const senders = [...new Set(messages.map(m => m.sender))];
  if (senders.length === 0) return messages;

  // Count messages per sender
  const counts = {};
  for (const m of messages) counts[m.sender] = (counts[m.sender] || 0) + 1;

  // Heuristic 1: If contactName matches one sender, other sender is me
  if (contactName && senders.length === 2) {
    const lowerContact = contactName.toLowerCase();
    const other = senders.find(s => !lowerContact.includes(s.toLowerCase()) && !s.toLowerCase().includes(lowerContact));
    if (other) {
      // The less frequent? Actually in 1-1 chats, both similar. Use name matching.
      // If contactName is close to one sender, that sender is them, other is me
      const them = senders.find(s => lowerContact.includes(s.toLowerCase()) || s.toLowerCase().includes(lowerContact)) || senders.find(s => s !== other);
      const me = senders.find(s => s !== them) || other;
      return messages.map(m => ({ ...m, isMine: m.sender === me }));
    }
  }

  // Heuristic 2: The sender with most messages that appears first often is me? Not reliable.
  // Better: assume the user is the one who appears most consistently across different times?
  // Fallback: most frequent sender is me (often you export your own chats, you have more msgs?)
  // Actually safer: first sender is me
  const sortedByCount = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const me = sortedByCount[0]?.[0] || senders[0];

  // If 2 senders and contactName is provided but didn't match, assume contactName is the other person
  if (senders.length === 2 && contactName) {
    const likelyThem = senders.find(s => s.toLowerCase() !== me.toLowerCase() && contactName.toLowerCase().includes(s.toLowerCase().split(' ')[0])) || senders.find(s => s !== me);
    if (likelyThem) {
      return messages.map(m => ({ ...m, isMine: m.sender !== likelyThem }));
    }
  }

  return messages.map(m => ({ ...m, isMine: m.sender === me }));
}

// Cleanup helper for blob URLs
export function revokeMediaUrls(mediaFiles) {
  if (!mediaFiles) return;
  Object.values(mediaFiles).forEach(url => {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      try { URL.revokeObjectURL(url); } catch {}
    }
  });
}
