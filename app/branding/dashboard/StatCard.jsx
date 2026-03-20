import React from 'react';

export const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = { blue: '#3b82f6', pink: '#f84464', emerald: '#10b981', purple: '#a855f7' };
  const c = colors[color] || '#3b82f6';
  return (
    <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1px solid #e5e7eb', flex: '1 1 160px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ padding: 8, borderRadius: 10, background: `${c}15`, color: c }}>
          <Icon size={18} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#1e1b4b' }}>{value}</div>
    </div>
  );
};
