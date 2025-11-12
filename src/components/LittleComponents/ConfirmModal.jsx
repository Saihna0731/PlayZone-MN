import React from 'react';

export default function ConfirmModal({ open, title = 'Баталгаажуулах', message = 'Энэ үйлдлийг хийх үү?', confirmText = 'Тийм', cancelText = 'Болих', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 360, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>{title}</h3>
        <p style={{ marginTop: 0, marginBottom: 16, color: '#444', fontSize: 14 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer' }}>{cancelText}</button>
          <button onClick={onConfirm} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
