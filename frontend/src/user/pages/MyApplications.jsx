import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Icon from '../components/common/Icon';
import { applicationsApi } from '../../api/index';

const allStatuses = ['All', 'Applied', 'Resume Reviewed', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Rejected'];

const statusStyles = {
  'Applied': { bg: '#EEF7FC', color: '#49769F' },
  'Resume Reviewed': { bg: '#F0F7FB', color: '#49769F' },
  'Shortlisted': { bg: '#EAF7FA', color: '#4E8EA2' },
  'Interview Scheduled': { bg: '#EDF6FB', color: '#49769F' },
  'Interviewed': { bg: '#EFF6FF', color: '#2563EB' },
  'Recommended': { bg: '#EAF7FA', color: '#4E8EA2' },
  'Offer Drafted': { bg: '#EAF7FA', color: '#4E8EA2' },
  'Contract Sent': { bg: '#EAF7FA', color: '#4E8EA2' },
  'Hired': { bg: '#D1FAE5', color: '#065F46' },
  'Rejected': { bg: '#FEF2F2', color: '#DC2626' },
};

function StatusBadge({ status }) {
  const s = statusStyles[status] || { bg: '#EEF7FC', color: '#49769F' };
  return (
    <span style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{status}</span>
  );
}

function CompanyLogo({ name = 'T' }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: `linear-gradient(135deg, hsl(${name.charCodeAt(0) * 5 % 360}, 55%, 50%), hsl(${name.charCodeAt(0) * 7 % 360}, 60%, 42%))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0,
    }}>{name[0]}</div>
  );
}

export default function MyApplications() {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    applicationsApi.list()
      .then(data => setApplications((data || []).map(a => ({ ...a, jobTitle: a.jobTitle || a.job_title || '', status: a.status || 'Applied' }))))
      .catch(() => setApplications([]));
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    let result = [...applications];
    if (activeStatus !== 'All') result = result.filter(a => a.status === activeStatus);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => a.jobTitle.toLowerCase().includes(q) || a.company.toLowerCase().includes(q));
    }
    return result;
  }, [applications, activeStatus, search]);

  const counts = useMemo(() => {
    const c = { All: applications.length };
    allStatuses.slice(1).forEach(s => { c[s] = applications.filter(a => a.status === s).length; });
    return c;
  }, [applications]);

  return (
    <AppLayout title="My Applications" subtitle={`${applications.length} total · ${applications.filter(a => !['Rejected', 'Hired'].includes(a.status)).length} active`}>
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Status overview cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Total Applied', count: applications.length, icon: 'clipboard', color: '#0A4174', bg: '#EAF5FB' },
            { label: 'In Progress', count: applications.filter(a => !['Rejected', 'Hired'].includes(a.status)).length, icon: 'timer', color: '#49769F', bg: '#F0F7FB' },
            { label: 'Interviews', count: applications.filter(a => a.status === 'Interview Scheduled').length, icon: 'calendar', color: '#49769F', bg: '#EDF6FB' },
            { label: 'Shortlisted', count: applications.filter(a => a.status === 'Shortlisted').length, icon: 'star', color: '#4E8EA2', bg: '#EAF7FA' },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: card.color }}>
                <Icon name={card.icon} size={20} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.count}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & search */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-wrapper" style={{ flex: 1, minWidth: 240 }}>
              <span className="search-icon"><Icon name="search" size={17} /></span>
              <input
                className="form-input search-input"
                placeholder="Search applications..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ height: 40 }}
              />
            </div>
            {/* Filter dropdown */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setFilterOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px',
                  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${activeStatus !== 'All' ? 'var(--primary)' : 'var(--border)'}`,
                  background: activeStatus !== 'All' ? 'var(--primary-light)' : '#fff',
                  color: activeStatus !== 'All' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s', whiteSpace: 'nowrap', minWidth: 150, justifyContent: 'space-between',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="filter" size={16} />
                  {activeStatus === 'All' ? 'All Statuses' : activeStatus}
                </span>
                <Icon name="chevronDown" size={16} style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {filterOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20, minWidth: 230,
                  background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
                  boxShadow: 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.12))', padding: 6, animation: 'fadeIn 0.12s ease',
                }}>
                  <div style={{ padding: '8px 12px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Filter by status</div>
                  {allStatuses.map(s => (
                    <button
                      key={s}
                      onClick={() => { setActiveStatus(s); setFilterOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 7,
                        border: 'none', cursor: 'pointer', fontSize: 14,
                        fontWeight: activeStatus === s ? 700 : 500,
                        background: activeStatus === s ? 'var(--primary-light)' : 'transparent',
                        color: activeStatus === s ? 'var(--primary)' : 'var(--text-primary)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { if (activeStatus !== s) e.currentTarget.style.background = 'var(--surface-2)'; }}
                      onMouseLeave={e => { if (activeStatus !== s) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {activeStatus === s ? <Icon name="check" size={15} /> : <span style={{ width: 15 }} />}
                        {s === 'All' ? 'All Statuses' : s}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{counts[s] || 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><Icon name="clipboard" size={30} /></div>
              <div className="empty-title">No applications found</div>
              <div className="empty-desc">
                {activeStatus !== 'All' ? `No applications with status "${activeStatus}".` : "You haven't applied to any jobs yet."}
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/user/jobs')}>Browse Jobs</button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Company</th>
                    <th>Date Applied</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => (
                    <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/applications/${app.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <CompanyLogo name={app.company} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{app.jobTitle}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.type}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{app.company}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.location.replace(', Saudi Arabia', '')}</div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{app.appliedDate}</td>
                      <td><StatusBadge status={app.status} /></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13, gap: 4 }}>View <Icon name="chevronRight" size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pipeline visualization */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Application Pipeline</h3>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {['Applied', 'Reviewed', 'Shortlisted', 'Interview', 'Offer', 'Hired'].map((stage, i, arr) => {
              const count = i === 0 ? applications.length
                : i === 1 ? applications.filter(a => ['Resume Reviewed', 'Shortlisted', 'Interview Scheduled', 'Interviewed', 'Recommended', 'Offer Drafted', 'Contract Sent', 'Hired'].includes(a.status)).length
                : i === 2 ? applications.filter(a => ['Shortlisted', 'Interview Scheduled', 'Interviewed', 'Recommended', 'Offer Drafted', 'Contract Sent', 'Hired'].includes(a.status)).length
                : i === 3 ? applications.filter(a => ['Interview Scheduled', 'Interviewed'].includes(a.status)).length
                : i === 4 ? applications.filter(a => ['Offer Drafted', 'Contract Sent'].includes(a.status)).length
                : applications.filter(a => a.status === 'Hired').length;
              const width = Math.max(30, (applications.length ? (count / applications.length) * 100 : 0));
              const colors = ['#0A4174', '#4E8EA2', '#7BBDE8', '#49769F', '#49769F', '#4E8EA2'];
              return (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 80 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, whiteSpace: 'nowrap' }}>{stage}</div>
                    <div style={{ height: 36, background: `${colors[i]}20`, borderRadius: i === 0 ? '8px 0 0 8px' : i === arr.length - 1 ? '0 8px 8px 0' : 0, display: 'flex', alignItems: 'center', paddingLeft: 12, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${width}%`, background: colors[i], borderRadius: 'inherit', opacity: 0.85 }} />
                      <span style={{ position: 'relative', fontSize: 14, fontWeight: 800, color: count > 0 ? '#fff' : 'var(--text-muted)', zIndex: 1 }}>{count}</span>
                    </div>
                  </div>
                  {i < arr.length - 1 && <div style={{ width: 0, height: 0, borderTop: '18px solid transparent', borderBottom: '18px solid transparent', borderLeft: `10px solid ${colors[i]}30`, flexShrink: 0, zIndex: 2 }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
