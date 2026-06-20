import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import logo from '../../assets/logo.png';
import { notificationsApi } from '../../../api/index';

const navItems = [
  { path: '/user/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/user/jobs', label: 'Browse Jobs', icon: 'search' },
  { path: '/user/applications', label: 'My Applications', icon: 'clipboard' },
  { path: '/user/contracts', label: 'My Contracts', icon: 'fileCheck' },
  { path: '/user/notifications', label: 'Notifications', icon: 'bell' },
  { path: '/user/ai-assistant', label: 'Career Assistant', icon: 'sparkles' },
  { path: '/user/support', label: 'Support Center', icon: 'headphones' },
];

const mobileNavItems = [
  ...navItems.slice(0, 3),
  { path: '/user/profile', label: 'My Profile', icon: 'user' },
  ...navItems.slice(3),
];

export default function Header({ mobileOpen, onMenuToggle, onClose }) {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  // Safe initials — user?.name?.split(' ') can return undefined if name is absent,
  // so we fall back to an empty array before calling .map() to avoid a TypeError
  // that would crash the entire component tree and produce a blank white screen.
  const initials = (user?.name?.split(' ') ?? []).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const go = (path) => {
    navigate(path);
    setUserMenuOpen(false);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    sessionStorage.clear();
    if (onClose) onClose();
    window.location.href = '/';
  };

  useEffect(() => {
    let alive = true;

    const loadUnreadNotifications = () => {
      notificationsApi.list()
        .then(data => {
          if (!alive) return;
          const rows = Array.isArray(data) ? data : [];
          setUnreadNotifications(rows.filter(n => !(n.is_read || n.read)).length);
        })
        .catch(() => {
          if (alive) setUnreadNotifications(0);
        });
    };

    const handleNotificationsChanged = (event) => {
      if (typeof event.detail?.unreadCount === 'number') {
        setUnreadNotifications(event.detail.unreadCount);
        return;
      }
      loadUnreadNotifications();
    };

    loadUnreadNotifications();
    window.addEventListener('notifications:changed', handleNotificationsChanged);
    return () => {
      alive = false;
      window.removeEventListener('notifications:changed', handleNotificationsChanged);
    };
  }, [location.pathname]);

  const NavLink = ({ item }) => {
    const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    const badge = item.path === '/user/notifications' ? unreadNotifications : item.badge;
    return (
      <button className={`top-nav-link ${active ? 'active' : ''}`} onClick={() => go(item.path)}>
        <Icon name={item.icon} size={16} strokeWidth={active ? 2.4 : 2} />
        <span>{item.label}</span>
        {badge > 0 && <span className="top-nav-badge">{badge}</span>}
      </button>
    );
  };

  return (
    <>
      <header className="topbar-header">
        <div className="topbar-shell">
          <button className="topbar-brand" onClick={() => go('/user/dashboard')} aria-label="TalentFlow home">
            <img src={logo} alt="TalentFlow" className="topbar-logo" />
          </button>

          <nav className="topbar-nav" aria-label="Main navigation">
            {navItems.map(item => <NavLink key={item.path} item={item} />)}
          </nav>

          <div className="topbar-actions">
            <button className="btn btn-ghost btn-icon" onClick={() => go('/user/notifications')} title="Notifications" style={{ position: 'relative' }}>
              <Icon name="bell" size={19} />
              {unreadNotifications > 0 && <span className="notif-dot" style={{ position: 'absolute', top: 8, right: 8 }} />}
            </button>

            <div className="topbar-user-menu-wrap">
              <button
                className={`topbar-user ${userMenuOpen ? 'active' : ''}`}
                onClick={() => setUserMenuOpen(open => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <div className="avatar avatar-sm">{initials}</div>
                <div className="topbar-user-text">
                  <strong>{user?.name?.split(' ')[0] || 'Candidate'}</strong>
                  <span>Candidate</span>
                </div>
                <Icon name="chevronDown" size={15} />
              </button>

              {userMenuOpen && (
                <div className="topbar-user-dropdown" role="menu">
                  <button onClick={() => go('/user/profile')} role="menuitem">
                    <Icon name="user" size={16} />
                    <span>My Profile</span>
                  </button>
                  <button onClick={() => go('/user/settings')} role="menuitem">
                    <Icon name="settings" size={16} />
                    <span>Settings</span>
                  </button>
                  <button className="dropdown-signout" onClick={handleLogout} role="menuitem">
                    <Icon name="logout" size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            <button className="mobile-menu-btn topbar-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
              <Icon name={mobileOpen ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <div className="mobile-menu-overlay" onClick={onClose} />}

      <div className={`mobile-top-menu ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-menu-head">
          <img src={logo} alt="TalentFlow" className="topbar-logo" />
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>

        <div className="mobile-user-card">
          <div className="avatar avatar-md">{initials}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.headline || 'Candidate'}</span>
          </div>
        </div>

        <nav className="mobile-nav-list">
          {mobileNavItems.map(item => <NavLink key={item.path} item={item} />)}
          <button className={`top-nav-link ${location.pathname === '/user/settings' ? 'active' : ''}`} onClick={() => go('/user/settings')}>
            <Icon name="settings" size={16} />
            <span>Settings</span>
          </button>
          <button className="top-nav-link signout-link" onClick={handleLogout}>
            <Icon name="logout" size={16} />
            <span>Sign Out</span>
          </button>
        </nav>
      </div>
    </>
  );
}
