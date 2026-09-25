import { Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function PrivacyBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('memoir_privacy_dismissed') === 'true'; } catch { return false; }
  });

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 mb-4 flex gap-3">
      <div className="shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
        <Shield size={16} className="text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-emerald-800">Privacy-first • Nothing leaves your device</h4>
        <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
          Your WhatsApp chats & photos are <strong>never saved to disk</strong>. They live only in RAM and vanish when you refresh or close the tab. 
          Scrapbooks you create are saved locally in your browser (IndexedDB), never uploaded. 
          No backend, no tracking, no cloud.
        </p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => { setDismissed(true); try { localStorage.setItem('memoir_privacy_dismissed','true'); } catch {} }}
            className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700"
          >
            Got it
          </button>
          <button 
            onClick={async () => {
              if (confirm('Clear all data? This will delete scrapbooks and clear RAM chats. Cannot be undone.')) {
                try {
                  const { clearAllData } = await import('../lib/storage');
                  await clearAllData();
                  window.location.reload();
                } catch {}
              }
            }}
            className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-lg hover:bg-emerald-50 flex items-center gap-1"
          >
            <Trash2 size={12} /> Clear all
          </button>
        </div>
      </div>
    </div>
  );
}
