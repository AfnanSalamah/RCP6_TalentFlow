import { useEffect, useMemo, useState } from 'react';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { formatLocalDateTime } from '../../utils/dateTime';
import { Activity, BarChart3, Bell, Check, HeartPulse, ShieldAlert, Trash2 } from 'lucide-react';

const SECTIONS = ['Platform Events', 'Security Alerts', 'System Health', 'Analytics Reports'];
const SECTION_ICONS = {
  'Platform Events': Bell,
  'Security Alerts': ShieldAlert,
  'System Health': HeartPulse,
  'Analytics Reports': BarChart3,
};
const SEVERITY = {
  Critical: { bg: '#FEF2F2', color: '#DC2626' },
  Warning: { bg: '#FFF7ED', color: '#C2410C' },
  Info: { bg: '#EFF6FF', color: '#0A4174' },
  Success: { bg: '#ECFDF5', color: '#047857' },
};

function normalizeNotification(n) {
  return {
    ...n,
    section: SECTIONS.includes(n.section) ? n.section : 'Platform Events',
    severity: SEVERITY[n.severity] ? n.severity : 'Info',
    is_read: Boolean(n.is_read ?? n.read),
    created_at: n.created_at ? formatLocalDateTime(n.created_at) : '',
  };
}

export default function SANotificationCenter() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState('Platform Events');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    setMsg('');
    try {
      const rows = await saApi.listNotifications();
      setItems((Array.isArray(rows) ? rows : []).map(normalizeNotification));
    } catch (e) {
      setMsg(e.message || 'Could not load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;
  const grouped = useMemo(() => Object.fromEntries(
    SECTIONS.map((section) => [section, items.filter((n) => n.section === section)])
  ), [items]);
  const visible = grouped[active] || [];

  function markRead(id) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    saApi.markNotificationRead(id).catch(() => {});
  }

  function markAllRead() {
    const unread = items.filter((n) => !n.is_read);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    Promise.allSettled(unread.map((n) => saApi.markNotificationRead(n.id))).catch(() => {});
  }

  function deleteItem(id) {
    if (!window.confirm('Delete this system alert?')) return;
    setItems((prev) => prev.filter((n) => n.id !== id));
    saApi.deleteNotification(id).catch(() => load());
  }

  return (
    <SALayout title="System Alerts Center">
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={hero}>
          <div>
            <p style={eyebrow}>System Alerts Center</p>
            <h1 style={title}>Notifications</h1>
            <p style={sub}>{unreadCount} unread platform alert{unreadCount === 1 ? '' : 's'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={load} style={secondaryBtn}>Refresh</button>
            {unreadCount > 0 && <button onClick={markAllRead} style={primaryBtn}><Check size={16} /> Mark all read</button>}
          </div>
        </div>

        <div style={tabs}>
          {SECTIONS.map((section) => {
            const Icon = SECTION_ICONS[section] || Activity;
            const count = grouped[section]?.length || 0;
            return (
              <button key={section} onClick={() => setActive(section)} style={active === section ? activeTab : tab}>
                <Icon size={17} />
                <span>{section}</span>
                <strong style={pill}>{count}</strong>
              </button>
            );
          })}
        </div>

        {msg && <div style={errorBox}>{msg}</div>}

        <div style={card}>
          {loading && <p style={emptyText}>Loading system alerts...</p>}
          {!loading && visible.length === 0 && <p style={emptyText}>No alerts in this section.</p>}
          {!loading && visible.map((n) => {
            const sev = SEVERITY[n.severity] || SEVERITY.Info;
            return (
              <div key={n.id} style={{ ...row, background: n.is_read ? '#fff' : '#F8FBFF' }}>
                <button onClick={() => markRead(n.id)} style={rowMain}>
                  <span style={{ ...severityDot, background: sev.color }} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#0F172A', fontSize: 15 }}>{n.title || 'System alert'}</strong>
                      <span style={{ ...badge, background: sev.bg, color: sev.color }}>{n.severity}</span>
                    </span>
                    <span style={message}>{n.message}</span>
                    <small style={meta}>{n.type || 'notification'} · {n.notification_category || 'system'} · {n.created_at}</small>
                  </span>
                  {!n.is_read && <span style={unreadDot} />}
                </button>
                <button onClick={() => deleteItem(n.id)} title="Delete alert" style={deleteBtn}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </SALayout>
  );
}

const hero = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' };
const eyebrow = { margin: 0, color: '#0A4174', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' };
const title = { margin: '4px 0', color: '#001D39', fontSize: 32, fontWeight: 900 };
const sub = { margin: 0, color: '#64748B', fontWeight: 700 };
const tabs = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 };
const tab = { border: '1px solid #E2E8F0', borderRadius: 12, background: '#fff', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 9, color: '#475569', fontWeight: 900, cursor: 'pointer' };
const activeTab = { ...tab, background: '#EAF6FC', borderColor: '#BDD8E9', color: '#0A4174' };
const pill = { marginLeft: 'auto', background: '#F1F5F9', borderRadius: 99, padding: '3px 9px', color: '#334155', fontSize: 12 };
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)' };
const row = { display: 'flex', gap: 8, alignItems: 'stretch', borderBottom: '1px solid #F1F5F9' };
const rowMain = { flex: 1, minWidth: 0, display: 'flex', gap: 13, alignItems: 'flex-start', padding: 16, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left' };
const severityDot = { width: 10, height: 10, borderRadius: 99, marginTop: 6, flexShrink: 0 };
const unreadDot = { width: 9, height: 9, borderRadius: 99, background: '#2563EB', marginTop: 7, flexShrink: 0 };
const badge = { borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 900 };
const message = { display: 'block', color: '#475569', fontSize: 14, marginTop: 6, lineHeight: 1.45 };
const meta = { color: '#94A3B8', fontWeight: 800, marginTop: 8, display: 'block' };
const deleteBtn = { width: 42, border: 0, borderLeft: '1px solid #F1F5F9', background: '#fff', color: '#DC2626', cursor: 'pointer' };
const primaryBtn = { border: 0, borderRadius: 12, padding: '10px 14px', background: '#001D39', color: '#fff', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', gap: 8, alignItems: 'center' };
const secondaryBtn = { border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 14px', background: '#fff', color: '#0F172A', fontWeight: 900, cursor: 'pointer' };
const emptyText = { margin: 0, padding: 36, textAlign: 'center', color: '#94A3B8', fontWeight: 700 };
const errorBox = { padding: 12, borderRadius: 12, background: '#FEF2F2', color: '#DC2626', fontWeight: 800 };
