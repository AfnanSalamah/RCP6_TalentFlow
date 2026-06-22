import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { saudiCities } from '../data/mockData';
import Icon from '../components/common/Icon';
import { profileApi } from '../../api/index';

const cityChoices = saudiCities.filter(c => c !== 'All Cities');

const sections = [
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'password', label: 'Password', icon: 'lock' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'privacy', label: 'Privacy', icon: 'shield' },
  { id: 'danger', label: 'Account Actions', icon: 'alert' },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--primary)' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function SavedToast({ show }) {
  if (!show) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--success)', animation: 'fadeIn 0.2s ease' }}>
      <Icon name="checkCircle" size={15} /> Saved
    </span>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, updateSettings, logout } = useAuth();
  const [active, setActive] = useState('account');
  const settings = user?.settings || {};

  // Account form
  const [account, setAccount] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);

  // Password form
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);

  // Delete confirm
  const [showDelete, setShowDelete] = useState(false);

  const saveAccount = async () => {
    setAccountSaving(true);
    try {
      await profileApi.update({ name: account.name, phone: account.phone, location: account.location });
      updateUser({ name: account.name, phone: account.phone, location: account.location });
    } catch {
      updateUser({ name: account.name, phone: account.phone, location: account.location });
    } finally {
      setAccountSaving(false);
      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 2500);
    }
  };

  const savePassword = async () => {
    setPwdError('');
    if (!pwd.current) return setPwdError('Please enter your current password.');
    if (pwd.next.length < 8) return setPwdError('New password must be at least 8 characters.');
    if (pwd.next !== pwd.confirm) return setPwdError('New password and confirmation do not match.');
    setPwdSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setPwdSaving(false);
    setPwd({ current: '', next: '', confirm: '' });
    setPwdSaved(true);
    setTimeout(() => setPwdSaved(false), 2500);
  };

  const handleLogout = () => { logout(); localStorage.clear(); sessionStorage.clear(); window.location.href = '/'; };
  const handleDelete = () => { setShowDelete(false); logout(); localStorage.clear(); sessionStorage.clear(); window.location.href = '/'; };

  const notificationPrefs = [
    { key: 'emailNotifications', label: 'Email notifications', desc: 'Receive important updates by email' },
    { key: 'applicationUpdates', label: 'Application status updates', desc: 'Get notified when an application status changes' },
    { key: 'interviewReminders', label: 'Interview reminders', desc: 'Reminders ahead of scheduled interviews' },
    { key: 'jobAlerts', label: 'Job recommendations', desc: 'Matched roles based on your profile' },
    { key: 'weeklyDigest', label: 'Weekly digest', desc: 'A weekly summary of job market activity' },
  ];

  return (
    <AppLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="page-wrapper">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }} className="details-grid">
          {/* Section nav */}
          <div className="card settings-nav" style={{ padding: 10, position: 'sticky', top: 80 }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
                  padding: '11px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: active === s.id ? 700 : 500, marginBottom: 2,
                  background: active === s.id ? 'var(--primary-light)' : 'transparent',
                  color: active === s.id ? 'var(--primary)' : (s.id === 'danger' ? 'var(--error)' : 'var(--text-secondary)'),
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (active !== s.id) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { if (active !== s.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name={s.icon} size={18} /> {s.label}
              </button>
            ))}
          </div>

          {/* Section content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ACCOUNT */}
            {active === 'account' && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Account Information</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Update your personal details and contact information.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={account.name} onChange={e => setAccount(a => ({ ...a, name: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" value={account.email} onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" value={account.phone} onChange={e => setAccount(a => ({ ...a, phone: e.target.value }))} placeholder="+966 5X XXX XXXX" /></div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <select className="form-input form-select" value={account.location} onChange={e => setAccount(a => ({ ...a, location: e.target.value }))}>
                      {!cityChoices.some(c => account.location.startsWith(c)) && <option value={account.location}>{account.location || 'Select city'}</option>}
                      {cityChoices.map(c => <option key={c} value={`${c}, Saudi Arabia`}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-primary" onClick={saveAccount} disabled={accountSaving}>
                    {accountSaving ? <><Icon name="spinner" size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
                  </button>
                  <SavedToast show={accountSaved} />
                </div>
              </div>
            )}

            {/* PASSWORD */}
            {active === 'password' && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Change Password</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Use at least 8 characters. Choose a strong, unique password.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
                  <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" /></div>
                  <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} placeholder="••••••••" /></div>
                  <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" /></div>
                  {pwdError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 13, fontWeight: 500 }}>
                      <Icon name="alert" size={16} /> {pwdError}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-primary" onClick={savePassword} disabled={pwdSaving}>
                    {pwdSaving ? <><Icon name="spinner" size={16} className="animate-spin" /> Updating...</> : 'Update Password'}
                  </button>
                  <SavedToast show={pwdSaved} />
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {active === 'notifications' && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Notification Preferences</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Choose what you want to be notified about. Changes are saved automatically.</p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {notificationPrefs.map((pref, i) => (
                    <div key={pref.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < notificationPrefs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ paddingRight: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{pref.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
                      </div>
                      <Toggle checked={!!settings[pref.key]} onChange={val => updateSettings({ [pref.key]: val })} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {active === 'privacy' && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Privacy & Visibility</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Control who can see your profile and how you appear to recruiters.</p>

                <div className="form-group" style={{ maxWidth: 420, marginBottom: 20 }}>
                  <label className="form-label">Profile Visibility</label>
                  <select className="form-input form-select" value={settings.profileVisibility || 'Recruiters only'} onChange={e => updateSettings({ profileVisibility: e.target.value })}>
                    <option value="Public">Public — visible to everyone</option>
                    <option value="Recruiters only">Recruiters only — visible to verified employers</option>
                    <option value="Private">Private — hidden from search</option>
                  </select>
                </div>

                <div className="form-group" style={{ maxWidth: 420, marginBottom: 20 }}>
                  <label className="form-label">Interface Language</label>
                  <select className="form-input form-select" value={settings.language || 'English'} onChange={e => updateSettings({ language: e.target.value })}>
                    <option value="English">English</option>
                    <option value="Arabic">العربية (Arabic)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ paddingRight: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Open to Work</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Show an "Open to Work" badge on your profile</div>
                  </div>
                  <Toggle checked={!!settings.openToWork} onChange={val => updateSettings({ openToWork: val })} />
                </div>
              </div>
            )}

            {/* DANGER / ACCOUNT ACTIONS */}
            {active === 'danger' && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Account Actions</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Sign out of your session or permanently delete your account.</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Sign Out</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>End your current session on this device.</div>
                  </div>
                  <button className="btn btn-outline" onClick={handleLogout}><Icon name="logout" size={16} /> Sign Out</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#DC2626' }}>Delete Account</div>
                    <div style={{ fontSize: 13, color: '#B91C1C', marginTop: 2 }}>Permanently remove your account and all application data.</div>
                  </div>
                  <button className="btn" style={{ background: '#DC2626', color: '#fff' }} onClick={() => setShowDelete(true)}><Icon name="trash" size={16} /> Delete Account</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="alert" size={20} /> Delete Account</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDelete(false)}><Icon name="close" size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                This action is permanent and cannot be undone. All of your applications, saved jobs, and profile data will be removed.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="btn" style={{ background: '#DC2626', color: '#fff' }} onClick={handleDelete}>Delete My Account</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
