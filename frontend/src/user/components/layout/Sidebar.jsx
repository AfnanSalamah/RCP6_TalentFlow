import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
// Put your logo file here: src/assets/logo.png
// import logo from '../../assets/logo.png';

const navItems = [
  { path: '/user/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/user/jobs', label: 'Browse Jobs', icon: 'search' },
  { path: '/user/applications', label: 'My Applications', icon: 'clipboard' },
  { path: '/user/contracts', label: 'My Contracts', icon: 'fileCheck' },
  { path: '/user/profile', label: 'My Profile', icon: 'user' },
  { path: '/user/notifications', label: 'Notifications', icon: 'bell', badge: 3 },
  { path: '/user/ai-assistant', label: 'Career Assistant', icon: 'sparkles' },
  { path: '/user/support', label: 'Support Center', icon: 'headphones' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'MA';
  const completion = user?.profileCompletion || 85;

  return (
    <>
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 98 }}
          onClick={onClose}
        />
      )}

      <aside className="app-sidebar" style={{
        position: 'fixed', top: 0, left: 0, height: '100vh',
        width: 'var(--sidebar-width)',
        background: '#fff',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 99,
        transform: mobileOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.25s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => handleNav('/user/dashboard')}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #001D39, #0A4174, #7BBDE8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'white', fontWeight: 800,
            }}>T</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>TalentFlow</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Candidate Portal</div>
            </div>
          </div>
        </div>

        {/* User card */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar avatar-md" style={{ flexShrink: 0, fontSize: 14 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.headline || 'Candidate'}</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Profile completion</span>
              <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>{completion}%</span>
            </div>
            <div className="progress-bar" style={{ height: 5 }}>
              <div className="progress-fill" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '10px 12px', borderRadius: 8, width: '100%',
                  background: active ? 'var(--primary-light)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 500, fontSize: 14,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name={item.icon} size={18} strokeWidth={active ? 2.4 : 2} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    minWidth: 20, height: 20, padding: '0 6px', background: 'var(--accent)',
                    color: 'white', borderRadius: 10, fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => handleNav('/user/settings')}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 12px', borderRadius: 8, width: '100%',
              background: location.pathname === '/user/settings' ? 'var(--primary-light)' : 'transparent',
              color: location.pathname === '/user/settings' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: location.pathname === '/user/settings' ? 600 : 500, fontSize: 14, border: 'none', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (location.pathname !== '/user/settings') e.currentTarget.style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { if (location.pathname !== '/user/settings') e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon name="settings" size={18} />
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 12px', borderRadius: 8, width: '100%',
              background: 'transparent', color: '#DC2626',
              fontWeight: 500, fontSize: 14, border: 'none', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="logout" size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
