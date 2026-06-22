import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { jobs as mockJobs, saudiCities } from '../data/mockData';
import Icon from '../components/common/Icon';
import { jobsApi } from '../../api/index';
import { compareJobsByPostedDateDesc, formatJobPostedAgoFromJob } from '../../utils/jobDates';

const remoteFilters = ['All', 'Onsite', 'Hybrid', 'Remote'];
const typeFilters = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];
const expFilters = ['All', 'Junior', 'Mid-level', 'Senior'];

function CompanyLogo({ name }) {
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: `linear-gradient(135deg, hsl(${name.charCodeAt(0) * 5 % 360}, 55%, 50%), hsl(${name.charCodeAt(0) * 7 % 360}, 60%, 42%))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0,
    }}>{name[0]}</div>
  );
}

function JobCard({ job, onView, onApply }) {
  const [saved, setSaved] = useState(job.saved);
  const postedLabel = formatJobPostedAgoFromJob(job);

  return (
    <div className="card card-hover" style={{ padding: 24, cursor: 'pointer', position: 'relative' }} onClick={() => onView(job.id)}>
      {job.featured && (
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'var(--warning-light)', borderRadius: 99, fontSize: 11, fontWeight: 700, color: 'var(--warning)' }}>
          <Icon name="star" size={12} style={{ fill: 'var(--warning)' }} /> Featured
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <CompanyLogo name={job.company} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 2 }}>{job.title}</h3>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="company" size={14} /> {job.company}</span>
            <span style={{ color: 'var(--border-hover)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="location" size={14} /> {job.location}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-secondary)' }}><Icon name="briefcase" size={12} /> {job.type}</span>
        <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: job.remote === 'Remote' ? '#EAF7FA' : job.remote === 'Hybrid' ? '#EDF6FB' : 'var(--surface-2)', color: job.remote === 'Remote' ? 'var(--success)' : job.remote === 'Hybrid' ? 'var(--info)' : 'var(--text-secondary)' }}>{job.remote}</span>
        <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#EAF7FA', color: 'var(--secondary)' }}>{job.experience}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {job.skills.slice(0, 4).map(s => (
          <span key={s} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{s}</span>
        ))}
        {job.skills.length > 4 && (
          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>+{job.skills.length - 4}</span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={13} /> {postedLabel}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="users" size={13} /> {job.applicants} applicants</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-sm btn-ghost"
            style={{ border: '1px solid var(--border)', padding: '6px 10px', color: saved ? 'var(--primary)' : 'var(--text-secondary)' }}
            onClick={e => { e.stopPropagation(); setSaved(s => !s); }}
            title={saved ? 'Saved' : 'Save job'}
          >
            <Icon name={saved ? 'bookmarkCheck' : 'bookmark'} size={15} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); onApply(job.id); }}>View Details</button>
        </div>
      </div>
    </div>
  );
}

export default function JobListings() {
  const navigate = useNavigate();
  const [search, setSearch]   = useState('');
  const [remote, setRemote]   = useState('All');
  const [type, setType]       = useState('All');
  const [exp, setExp]         = useState('All');
  const [location, setLocation] = useState('All Cities');
  const [sortBy, setSortBy]   = useState('recent');
  const [apiJobs, setApiJobs] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const fetchJobs = useCallback(() => {
    setLoadingJobs(true);
    const params = {};
    if (search)                params.search = search;
    if (remote !== 'All')      params.remote = remote;
    if (type !== 'All')        params.job_type = type;
    if (location !== 'All Cities') params.location = location;
    jobsApi.list(params)
      .then(res => setApiJobs(res?.jobs || []))
      .catch(() => setApiJobs(null))
      .finally(() => setLoadingJobs(false));
  }, [search, remote, type, location]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filtered = useMemo(() => {
    const source = apiJobs || mockJobs;
    let result = [...source];
    if (!apiJobs && search) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.skills || j.skills_required || []).some(s => s.toLowerCase().includes(q))
      );
    }
    if (!apiJobs && remote !== 'All') result = result.filter(j => j.remote === remote);
    if (!apiJobs && type !== 'All')   result = result.filter(j => j.type === type);
    if (!apiJobs && location !== 'All Cities') result = result.filter(j => j.location?.startsWith(location));
    if (sortBy === 'recent') result.sort(compareJobsByPostedDateDesc);
    return result;
  }, [apiJobs, search, remote, type, exp, location, sortBy]);

  const FilterButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        background: active ? 'var(--primary-light)' : '#fff',
        color: active ? 'var(--primary)' : 'var(--text-secondary)',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >{label}</button>
  );

  return (
    <AppLayout title="Browse Jobs" subtitle={`${filtered.length} open positions across the Kingdom`}>
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Search bar */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="search-wrapper" style={{ flex: 1, minWidth: 240 }}>
              <span className="search-icon"><Icon name="search" size={18} /></span>
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search by title, company, or skill..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ height: 46 }}
              />
            </div>
            <select className="form-input form-select" value={location} onChange={e => setLocation(e.target.value)} style={{ width: 200, height: 46 }}>
              {saudiCities.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select className="form-input form-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 170, height: 46 }}>
              <option value="recent">Most Recent</option>
              <option value="relevant">Most Relevant</option>
            </select>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>Work type:</span>
            {remoteFilters.map(f => <FilterButton key={f} label={f} active={remote === f} onClick={() => setRemote(f)} />)}
            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>Experience:</span>
            {expFilters.map(f => <FilterButton key={f} label={f} active={exp === f} onClick={() => setExp(f)} />)}
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>Job type:</span>
            {typeFilters.map(f => <FilterButton key={f} label={f} active={type === f} onClick={() => setType(f)} />)}
            {(remote !== 'All' || type !== 'All' || exp !== 'All' || search || location !== 'All Cities') && (
              <button
                onClick={() => { setRemote('All'); setType('All'); setExp('All'); setSearch(''); setLocation('All Cities'); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}
              ><Icon name="close" size={13} /> Clear Filters</button>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', gap: 20 }} className="jobs-grid">
          <div style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="search" size={30} /></div>
                  <div className="empty-title">No jobs found</div>
                  <div className="empty-desc">Try adjusting your search or filters to find more opportunities.</div>
                  <button className="btn btn-primary" onClick={() => { setRemote('All'); setType('All'); setExp('All'); setSearch(''); setLocation('All Cities'); }}>Clear all filters</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}><strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> jobs found</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {filtered.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onView={id => navigate(`/user/jobs/${id}`)}
                      onApply={id => navigate(`/user/jobs/${id}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ width: 280, flexShrink: 0 }} className="jobs-sidebar">
            <div className="card" style={{ padding: 20, marginBottom: 16, background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', border: 'none' }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="sparkles" size={16} /> Career Assistant</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 14, lineHeight: 1.6 }}>Get tailored job recommendations and CV advice for the Saudi market.</p>
              <button className="btn btn-white btn-sm" style={{ width: '100%' }} onClick={() => navigate('/user/ai-assistant')}>Open Assistant</button>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Job Search Tips</h3>
              {[
                'Tailor your CV for each role and employer',
                'Highlight Arabic and English proficiency',
                'Follow up within 5 business days',
                'Research the company before interviews',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }}><Icon name="check" size={14} /></span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
