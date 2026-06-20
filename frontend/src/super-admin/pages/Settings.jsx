import { useEffect, useState } from 'react';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { Shield, KeyRound, Mail, SlidersHorizontal, CreditCard, Bot, Save } from 'lucide-react';

const sections = [
  ['security', 'Security Settings', Shield],
  ['password', 'Password Settings', KeyRound],
  ['email_notifications', 'Email Notifications', Mail],
  ['platform', 'Platform Settings', SlidersHorizontal],
  ['subscription', 'Subscription Settings', CreditCard],
  ['ai', 'AI Settings', Bot],
];

export default function SASettings() {
  const [settings, setSettings] = useState({});
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { saApi.getSettings().then(setSettings).catch(e => setMsg(e.message)); }, []);
  const update = (section, key, value) => setSettings(s => ({ ...s, [section]: { ...(s[section] || {}), [key]: parseValue(value) } }));
  async function save() {
    setSaving(true); setMsg('');
    try { const updated = await saApi.updateSettings(settings); setSettings(updated); setMsg('Settings saved successfully.'); }
    catch (e) { setMsg(e.message || 'Save failed'); }
    finally { setSaving(false); }
  }
  return <SALayout title="Super Admin Settings">
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ color: '#64748B', margin: 0 }}>All settings are saved in SQLite through FastAPI and reloaded from the database.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        {sections.map(([key, title, Icon]) => <div key={key} style={card}>
          <h3 style={{ margin: '0 0 16px', color: '#001D39', display: 'flex', gap: 8, alignItems: 'center' }}><Icon size={18} /> {title}</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(settings[key] || {}).map(([field, value]) => <label key={field} style={{ display: 'grid', gap: 6 }}>
              <span style={label}>{field.replaceAll('_', ' ')}</span>
              {typeof value === 'boolean' ? <select style={input} value={String(value)} onChange={e => update(key, field, e.target.value)}><option value="true">Enabled</option><option value="false">Disabled</option></select> : <input style={input} value={value ?? ''} onChange={e => update(key, field, e.target.value)} />}
            </label>)}
          </div>
        </div>)}
      </div>
      {msg && <div style={{ padding: 12, borderRadius: 12, background: msg.includes('success') ? '#D1FAE5' : '#FEF2F2', color: msg.includes('success') ? '#065F46' : '#DC2626', fontWeight: 800 }}>{msg}</div>}
      <button onClick={save} disabled={saving} style={{ justifySelf: 'start', border: 0, borderRadius: 12, padding: '12px 22px', background: '#001D39', color: '#fff', fontWeight: 900, display: 'flex', gap: 8, alignItems: 'center' }}><Save size={16} /> {saving ? 'Saving…' : 'Save Settings'}</button>
    </div>
  </SALayout>;
}
function parseValue(v) { if (v === 'true') return true; if (v === 'false') return false; if (v !== '' && !Number.isNaN(Number(v))) return Number(v); return v; }
const card = { background: '#fff', border: '1px solid #F1F5F9', borderRadius: 18, padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,.05)' };
const label = { color: '#475569', fontWeight: 800, fontSize: 12, textTransform: 'capitalize' };
const input = { padding: '11px 12px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none' };
