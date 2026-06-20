import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/common/Icon';
import { dashboardApi, jobsApi, notificationsApi, applicationsApi } from '../../api/index';

const statusColors = {
  'Applied':             { bg: '#EEF7FC', color: '#49769F' },
  'Resume Reviewed':     { bg: '#F0F7FB', color: '#49769F' },
  'Shortlisted':         { bg: '#EAF7FA', color: '#4E8EA2' },
  'Interview Scheduled': { bg: '#EDF6FB', color: '#49769F' },
  'Hired':               { bg: '#D1FAE5', color: '#065F46' },
  'Rejected':            { bg: '#FEF2F2', color: '#DC2626' },
};

function StatusBadge({ status }) {
  const c = statusColors[status] || { bg: '#EEF7FC', color: '#49769F' };
  return (
    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{status}</span>
  );
}

function CompanyLogo({ name = 'T', size = 36, radius = 9, fontSize = 14 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: 'linear-gradient(135deg, #001D39 0%, #0A4174 45%, #4E8EA2 75%, #7BBDE8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize, flexShrink: 0,
    }}>{(name || 'T')[0].toUpperCase()}</div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [dashData,        setDashData]        = useState(null);
  const [applications,    setApplications]    = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [notifications,   setNotifications]   = useState([]);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    Promise.allSettled([
      dashboardApi.applicant(),
      applicationsApi.list(),
      jobsApi.list({ limit: 3 }),
      notificationsApi.list(),
    ]).then(([dash, apps, jobs, notifs]) => {
      if (dash.status === 'fulfilled')  setDashData(dash.value);
      if (apps.status === 'fulfilled')  setApplications(Array.isArray(apps.value) ? apps.value : []);
      if (jobs.status === 'fulfilled')  setRecommendedJobs(jobs.value?.jobs || []);
      if (notifs.status === 'fulfilled') {
        const list = Array.isArray(notifs.value) ? notifs.value : (notifs.value?.notifications ?? []);
        setNotifications(list);
      }
      setLoading(false);
    });
  }, []);

  const total       = dashData?.totalApplications       ?? applications.length;
  const activeApps  = dashData?.activeApplications      ?? applications.filter(a => !['Rejected','Hired'].includes(a.status)).length;
  const interviews  = dashData?.interviewsScheduled     ?? applications.filter(a => a.status === 'Interview Scheduled').length;
  const shortlisted = dashData?.applicationsByStatus?.['Shortlisted'] ?? applications.filter(a => a.status === 'Shortlisted').length;
  const profilePct  = dashData?.profileCompletion       ?? user?.profileCompletion ?? 0;

  const recentApps = applications.slice(0, 4);

  function openNotification(n) {
    setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item));
    notificationsApi.markRead(n.id).catch(() => null);
    if (!n.link) {
      navigate('/user/notifications');
      return;
    }
    if (n.link.startsWith('/user/')) {
      navigate(n.link);
      return;
    }
    if (n.link.startsWith('/applications/') || n.link.startsWith('/jobs/') || n.link.startsWith('/contracts')) {
      navigate(`/user${n.link}`);
      return;
    }
    navigate('/user/notifications');
  }

  const stats = [
    { label: 'Applications',       value: total,       icon: 'clipboard', color: '#0A4174', bg: '#EAF5FB', sub: `${activeApps} in progress` },
    { label: 'Interviews',         value: interviews,  icon: 'calendar',  color: '#49769F', bg: '#EDF6FB', sub: 'Scheduled' },
    { label: 'Shortlisted',        value: shortlisted, icon: 'star',      color: '#4E8EA2', bg: '#EAF7FA', sub: 'Awaiting next step' },
    { label: 'Profile Completion', value: `${profilePct}%`, icon: 'badge', color: '#4E8EA2', bg: '#EAF7FA', sub: profilePct < 100 ? 'Complete your profile' : 'Profile complete' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Profile completion checklist derived from real user data
  const checklistItems = [
    { label: 'Account created',   done: true },
    { label: 'Work experience',   done: !!(user?.experiences?.length || dashData?.hasExperience) },
    { label: 'Education added',   done: !!(user?.education?.length   || dashData?.hasEducation) },
    { label: 'Skills added',      done: !!(user?.skills?.length      || dashData?.hasSkills) },
    { label: 'CV uploaded',       done: !!(dashData?.hasResume       || profilePct >= 30) },
    { label: 'Contact info',      done: !!(user?.phone || user?.location) },
  ];

  return (
    <AppLayout>
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #001D39 0%, #0A4174 52%, #4E8EA2 100%)',
          borderRadius: 16, padding: '28px 32px', position: 'relative', overflow: 'hidden',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20,
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 120, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: 6 }}>{greeting}</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>Welcome back, {firstName}</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
              {interviews > 0
                ? <>You have <strong style={{ color: '#fff' }}>{interviews} interview{interviews !== 1 ? 's' : ''}</strong> scheduled and <strong style={{ color: '#fff' }}>{activeApps} active application{activeApps !== 1 ? 's' : ''}</strong> in progress.</>
                : total > 0
                  ? <>You have <strong style={{ color: '#fff' }}>{activeApps} active application{activeApps !== 1 ? 's' : ''}</strong> in progress.</>
                  : 'Browse available jobs and start applying today.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, position: 'relative', flexWrap: 'wrap' }}>
            <button className="btn btn-white btn-sm" onClick={() => navigate('/user/jobs')}>Browse Jobs</button>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }} onClick={() => navigate('/user/applications')}>My Applications</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {stats.map((s, i) => (
            <div key={i} className="card" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 }}>{s.label}</p>
                  <div style={{ fontSize: 32, fontWeight: 900, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  <Icon name={s.icon} size={20} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="dash-grid">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Recent Applications */}
            <div className="card">
              <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Recent Applications</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{applications.length} total applications</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/user/applications')}>View All</button>
              </div>
              {recentApps.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EAF5FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#49769F' }}>
                    <Icon name="clipboard" size={26} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>No applications submitted yet</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Start applying to jobs that match your skills.</div>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/user/jobs')}>Browse Jobs</button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="data-table" style={{ width: '100%', minWidth: 720 }}>
                    <thead>
                      <tr><th>Position</th><th>Company</th><th>Applied</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {recentApps.map(app => (
                        <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/applications/${app.id}`)}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.job_title || app.jobTitle}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{app.company}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : app.appliedDate}
                          </td>
                          <td><StatusBadge status={app.status} /></td>
                          <td style={{ color: 'var(--text-muted)' }}><Icon name="chevronRight" size={16} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recommended Jobs */}
            <div className="card">
              <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16 }}>Recommended for You</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Latest available positions</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/user/jobs')}>Browse All</button>
              </div>
              {recommendedJobs.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  <Icon name="briefcase" size={28} style={{ marginBottom: 10, color: '#BDD8E9' }} />
                  <div>No jobs available right now. Check back soon.</div>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {recommendedJobs.map(job => (
                    <div key={job.id} className="card-hover" style={{ padding: '16px', borderRadius: 10, cursor: 'pointer', border: '1px solid transparent' }} onClick={() => navigate(`/user/jobs/${job.id}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, display: 'flex', gap: 12 }}>
                          <CompanyLogo name={job.company} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{job.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                              <span>{job.company}</span>
                              {job.location && <><span style={{ color: 'var(--border-hover)' }}>·</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="location" size={12} /> {job.location}</span></>}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                              {job.job_type && <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>{job.job_type}</span>}
                              {job.remote   && <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>{job.remote}</span>}
                            </div>
                          </div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/user/jobs/${job.id}`); }}>View</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Profile completion */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Profile Completion</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="6" />
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#0A4174" strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 30}`}
                      strokeDashoffset={`${2 * Math.PI * 30 * (1 - profilePct / 100)}`}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{profilePct}%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {profilePct >= 80 ? 'Looking great!' : profilePct >= 40 ? 'Keep going' : 'Just getting started'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Complete profile = more recruiter visibility</div>
                </div>
              </div>
              {checklistItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.done ? 'var(--success-light)' : 'var(--surface-2)', border: `2px solid ${item.done ? 'var(--success)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--success)' }}>
                    {item.done && <Icon name="check" size={11} />}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: item.done ? 400 : 500, textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                </div>
              ))}
              <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/user/profile')}>
                {profilePct < 100 ? 'Complete Profile' : 'View Profile'}
              </button>
            </div>

            {/* Notifications */}
            <div className="card">
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Notifications</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/user/notifications')} style={{ fontSize: 12, color: 'var(--primary)' }}>View all</button>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No notifications yet.
                </div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {notifications.slice(0, 4).map(n => (
                    <div key={n.id}
                      style={{ padding: '12px 20px', display: 'flex', gap: 12, cursor: 'pointer', background: n.read ? 'transparent' : '#FAFBFF', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : '#FAFBFF'}
                      onClick={() => openNotification(n)}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: n.read ? 'var(--surface-2)' : 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: n.read ? 'var(--text-muted)' : 'var(--primary)' }}>
                        <Icon name={n.type === 'interview' ? 'calendar' : n.type === 'status_update' ? 'chart' : n.type === 'welcome' ? 'sparkles' : 'lightbulb'} size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                        </div>
                      </div>
                      {!n.read && <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: 'search',    label: 'Browse Jobs',      path: '/user/jobs' },
                  { icon: 'sparkles',  label: 'Career Assistant', path: '/user/ai-assistant' },
                  { icon: 'user',      label: 'Update Profile',   path: '/user/profile' },
                ].map(a => (
                  <button key={a.path} className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, width: '100%', border: '1px solid var(--border)' }} onClick={() => navigate(a.path)}>
                    <Icon name={a.icon} size={18} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{a.label}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}><Icon name="chevronRight" size={16} /></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Need Help? — Support Center */}
            <div className="card" style={{ padding: 20, marginTop: 16, background: 'linear-gradient(135deg,#0A4174,#4E8EA2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Icon name="headphones" size={22} color="#fff" />
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Need Help?</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Our platform team is here for you.</p>
                </div>
              </div>
              <button className="btn" style={{ width: '100%', justifyContent: 'center', gap: 8, background: '#fff', color: '#0A4174', fontWeight: 700, borderRadius: 10, padding: '10px 12px' }} onClick={() => navigate('/user/support')}>
                <Icon name="headphones" size={16} /> Open Support Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
