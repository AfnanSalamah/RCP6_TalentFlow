import { useEffect, useState } from 'react';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { Shield, Mail, User, KeyRound, Save, Phone, Calendar, Clock, Upload, Activity, History, Lock } from 'lucide-react';

const emptyProfile = {
  full_name: '', name: '', email: '', phone: '', role: 'SuperAdmin', created_at: '', last_login: '', profile_picture: '', two_factor_enabled: true,
};

export default function SAProfile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const [history, setHistory] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [p, h, a] = await Promise.all([saApi.me(), saApi.loginHistory(), saApi.accountActivity()]);
      setProfile({ ...emptyProfile, ...p, full_name: p.full_name || p.name || '' });
      setHistory(Array.isArray(h) ? h : []);
      setActivity(Array.isArray(a) ? a : []);
    } catch (e) {
      setMsg(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveProfile() {
    setSaving(true); setMsg('');
    try {
      const payload = { full_name: profile.full_name || profile.name, email: profile.email, phone: profile.phone };
      if (passwords.new_password) Object.assign(payload, passwords);
      const updated = await saApi.updateProfile(payload);
      setProfile((p) => ({ ...p, ...updated, full_name: updated.full_name || updated.name || p.full_name }));
      setPasswords({ current_password: '', new_password: '' });
      setMsg('Profile updated successfully.');
      load();
    } catch (e) { setMsg(e.message || 'Update failed'); }
    finally { setSaving(false); }
  }

  async function toggle2FA() {
    try {
      const result = await saApi.set2FA(!profile.two_factor_enabled);
      setProfile(p => ({ ...p, two_factor_enabled: result.two_factor_enabled }));
      setMsg(`Two-factor authentication ${result.two_factor_enabled ? 'enabled' : 'disabled'}.`);
      load();
    } catch (e) { setMsg(e.message || '2FA update failed'); }
  }

  async function uploadAvatar(file) {
    if (!file) return;
    try {
      const result = await saApi.uploadAvatar(file);
      setProfile(p => ({ ...p, profile_picture: result.profile_picture }));
      setMsg('Profile picture updated.');
    } catch (e) { setMsg(e.message || 'Upload failed'); }
  }

  const fullName = profile.full_name || profile.name || 'Super Admin';
  const initials = fullName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <SALayout title="Super Admin Profile">
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ background: 'linear-gradient(135deg,#001D39,#0A4174)', borderRadius: 22, padding: 28, color: '#fff', display: 'flex', alignItems: 'center', gap: 18, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 74, height: 74, borderRadius: 22, background: 'rgba(255,255,255,0.16)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22 }}>
              {profile.profile_picture ? <img src={profile.profile_picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials || <Shield size={34} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>{fullName}</h2>
              <p style={{ margin: '6px 0 0', opacity: .82 }}>{profile.email}</p>
              <p style={{ margin: '6px 0 0', opacity: .7, fontSize: 13 }}>{profile.role || 'SuperAdmin'}</p>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.16)', padding: '11px 14px', borderRadius: 12, cursor: 'pointer', fontWeight: 800 }}>
            <Upload size={16} /> Upload Picture
            <input type="file" accept="image/*" hidden onChange={e => uploadAvatar(e.target.files?.[0])} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          <Info icon={Calendar} label="Created Date" value={formatDate(profile.created_at || profile.created_date)} />
          <Info icon={Clock} label="Last Login" value={formatDate(profile.last_login) || 'No login recorded'} />
          <Info icon={Lock} label="Two-Factor Authentication" value={profile.two_factor_enabled ? 'Enabled' : 'Disabled'} action={<button style={miniBtn} onClick={toggle2FA}>{profile.two_factor_enabled ? 'Disable' : 'Enable'}</button>} />
        </div>

        <Card title="Account Details">
          {loading ? <p style={{ color: '#94A3B8' }}>Loading…</p> : <div style={{ display: 'grid', gap: 14 }}>
            <label style={labelSt}><User size={15} /> Full Name</label>
            <input style={inputSt} value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
            <label style={labelSt}><Mail size={15} /> Email</label>
            <input style={inputSt} value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
            <label style={labelSt}><Phone size={15} /> Phone</label>
            <input style={inputSt} value={profile.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
          </div>}
        </Card>

        <Card title="Change Password">
          <p style={{ margin: '0 0 18px', color: '#64748B', fontSize: 13 }}>Leave this section empty if you only want to update profile or email.</p>
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={labelSt}><KeyRound size={15} /> Current Password</label>
            <input type="password" style={inputSt} value={passwords.current_password} onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))} />
            <label style={labelSt}><KeyRound size={15} /> New Password</label>
            <input type="password" style={inputSt} value={passwords.new_password} onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))} />
          </div>
        </Card>

        {msg && <div style={{ padding: '12px 14px', borderRadius: 12, fontWeight: 700, background: msg.includes('success') || msg.includes('updated') || msg.includes('enabled') || msg.includes('disabled') ? '#D1FAE5' : '#FEF2F2', color: msg.includes('failed') || msg.includes('Failed') ? '#DC2626' : '#065F46' }}>{msg}</div>}
        <button onClick={saveProfile} disabled={saving} style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: 8, border: 0, borderRadius: 12, padding: '12px 22px', background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>
          <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
          <Card title="Login History" icon={History}>
            <List rows={history} primary={(r) => formatDate(r.login_time)} secondary={(r) => `${r.status || 'success'} • ${r.ip_address || 'IP not recorded'}`} empty="No login history yet." />
          </Card>
          <Card title="Account Activity" icon={Activity}>
            <List rows={activity} primary={(r) => r.action} secondary={(r) => `${r.description || ''} ${formatDate(r.created_at) ? '• ' + formatDate(r.created_at) : ''}`} empty="No activity yet." />
          </Card>
        </div>
      </div>
    </SALayout>
  );
}

function Card({ title, children, icon: Icon }) {
  return <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 18, padding: 26, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
    <h3 style={{ margin: '0 0 18px', color: '#001D39', fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>{Icon && <Icon size={18} />} {title}</h3>
    {children}
  </div>;
}
function Info({ icon: Icon, label, value, action }) { return <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #F1F5F9' }}><div style={labelSt}><Icon size={16} /> {label}</div><div style={{ marginTop: 8, fontWeight: 900, color: '#001D39' }}>{value}</div>{action && <div style={{ marginTop: 10 }}>{action}</div>}</div>; }
function List({ rows, primary, secondary, empty }) { if (!rows?.length) return <p style={{ color: '#94A3B8' }}>{empty}</p>; return <div style={{ display: 'grid', gap: 10 }}>{rows.slice(0, 8).map((r, i) => <div key={r.id || i} style={{ padding: 12, borderRadius: 12, background: '#F8FAFC' }}><div style={{ fontWeight: 800, color: '#0F172A' }}>{primary(r) || '—'}</div><div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{secondary(r)}</div></div>)}</div>; }
function formatDate(v) { if (!v) return ''; const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString(); }
const labelSt = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: '#475569' };
const inputSt = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 12, outline: 'none', fontSize: 14, color: '#0F172A' };
const miniBtn = { border: 0, borderRadius: 10, padding: '8px 12px', background: '#001D39', color: '#fff', fontWeight: 800, cursor: 'pointer' };
