import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Icon from '../components/common/Icon';
import { notificationsApi } from '../../api/index';

const notifMeta = {
  interview: { icon: 'calendar', bg: '#EDF6FB', color: '#49769F' },
  status: { icon: 'chart', bg: '#EAF7FA', color: '#4E8EA2' },
  recommendation: { icon: 'briefcase', bg: '#EAF5FB', color: '#0A4174' },
  tip: { icon: 'lightbulb', bg: '#F0F7FB', color: '#49769F' },
  offer: { icon: 'gift', bg: '#EAF7FA', color: '#4E8EA2' },
  contract: { icon: 'fileCheck', bg: '#EAF5FB', color: '#0A4174' },
};

const filters = ['All', 'Unread', 'Interviews', 'Status Updates', 'Recommendations'];

const notifyUnreadCount = (rows) => {
  const unreadCount = rows.filter(n => !(n.is_read || n.read)).length;
  window.dispatchEvent(new CustomEvent('notifications:changed', { detail: { unreadCount } }));
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    notificationsApi.list()
      .then(data => setNotifs(Array.isArray(data) ? data : []))
      .catch(() => null);
  }, []);

  const unreadCount = notifs.filter(n => !(n.is_read || n.read)).length;

  const markAllRead = () => {
    setNotifs(n => {
      const next = n.map(x => ({ ...x, read: true, is_read: true }));
      notifyUnreadCount(next);
      return next;
    });
    notificationsApi.markAllRead().catch(() => null);
  };
  const markRead = (id) => {
    setNotifs(n => {
      const next = n.map(x => x.id === id ? { ...x, read: true, is_read: true } : x);
      notifyUnreadCount(next);
      return next;
    });
    notificationsApi.markRead(id).catch(() => null);
  };
  const deleteNotif = (id) => {
    setNotifs(n => {
      const next = n.filter(x => x.id !== id);
      notifyUnreadCount(next);
      return next;
    });
    notificationsApi.delete(id).catch(() => null);
  };
const goToNotification = (n) => {
  if (!n.link) {
    navigate('/user/notifications');
    return;
  }

  if (n.link.startsWith('/user/')) {
    navigate(n.link);
    return;
  }

  if (n.link.startsWith('/hr/') || n.link.startsWith('/super-admin/')) {
    navigate('/user/notifications');
    return;
  }

  if (n.link.startsWith('/applications/')) {
    navigate(`/user${n.link}`);
    return;
  }

  if (n.link.startsWith('/jobs/')) {
    navigate(`/user${n.link}`);
    return;
  }

  navigate('/user/notifications');
};
  const filtered = notifs.filter(n => {
    const unread = !(n.is_read || n.read);
    if (filter === 'All') return true;
    if (filter === 'Unread') return unread;
    if (filter === 'Interviews') return n.type === 'interview';
    if (filter === 'Status Updates') return n.type === 'status';
    if (filter === 'Recommendations') return n.type === 'recommendation';
    return true;
  });

  return (
    <AppLayout title="Notifications" subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}>
      <div className="page-wrapper" style={{ maxWidth: 800 }}>
        {/* Header actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
                  background: filter === f ? 'var(--primary-light)' : '#fff',
                  color: filter === f ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >{f}</button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 600, gap: 5 }} onClick={markAllRead}>
              <Icon name="checkAll" size={15} /> Mark all as read
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><Icon name="bell" size={30} /></div>
              <div className="empty-title">No notifications</div>
              <div className="empty-desc">You're all caught up. New notifications will appear here.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filtered.some(n => !(n.is_read || n.read)) && (
              <>
                <div style={{ padding: '8px 4px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  New · {filtered.filter(n => !(n.is_read || n.read)).length}
                </div>
                {filtered.filter(n => !(n.is_read || n.read)).map(n => (
                  <NotifCard key={n.id} n={n} onRead={markRead} onDelete={deleteNotif} onClick={() => { markRead(n.id); goToNotification(n); }} />
                ))}
              </>
            )}

            {filtered.some(n => n.is_read || n.read) && (
              <>
                <div style={{ padding: '16px 4px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Earlier
                </div>
                {filtered.filter(n => n.is_read || n.read).map(n => (
                  <NotifCard key={n.id} n={n} onRead={markRead} onDelete={deleteNotif} onClick={() => { goToNotification(n); }} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function NotifCard({ n, onRead, onDelete, onClick }) {
  const meta = notifMeta[n.type] || notifMeta.status;
  const isRead = n.is_read || n.read;
  return (
    <div
      style={{
        display: 'flex', gap: 14, padding: '16px 20px', cursor: 'pointer', borderRadius: 12,
        background: isRead ? '#fff' : '#FAFBFF', border: '1px solid',
        borderColor: isRead ? 'var(--border)' : '#E0E7FF',
        marginBottom: 8, transition: 'all 0.15s', position: 'relative',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isRead ? 'var(--border)' : '#E0E7FF'}
      onClick={onClick}
    >
      {!isRead && (
        <div style={{ position: 'absolute', top: 16, left: 8, width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%' }} />
      )}
      <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: meta.color }}>
        <Icon name={meta.icon} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: isRead ? 500 : 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>{n.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{n.message}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.time}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {!isRead && (
          <button
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: 6, borderRadius: 6, cursor: 'pointer', background: '#fff' }}
            onClick={e => { e.stopPropagation(); onRead(n.id); }}
            title="Mark as read"
          ><Icon name="check" size={14} /></button>
        )}
        <button
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: 6, borderRadius: 6, cursor: 'pointer', background: '#fff' }}
          onClick={e => { e.stopPropagation(); onDelete(n.id); }}
          title="Dismiss"
        ><Icon name="close" size={14} /></button>
      </div>
    </div>
  );
}
