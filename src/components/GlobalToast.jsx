import React, { useEffect, useState } from 'react';
import Toast from './Toast';

// Global toast listener that survives modal unmounts.
// Usage:
//   window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success'|'error'|'info', message: '...' } }))
//   window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'success'|'error'|'info', message: '...' } }))
export default function GlobalToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const t = e.detail || null;
      if (t && t.message) setToast({ type: t.type || 'success', message: t.message });
    };
    window.addEventListener('toast', handler);
    window.addEventListener('toast:show', handler);
    return () => {
      window.removeEventListener('toast', handler);
      window.removeEventListener('toast:show', handler);
    };
  }, []);

  if (!toast) return null;
  return <Toast toast={toast} onClose={() => setToast(null)} />;
}
