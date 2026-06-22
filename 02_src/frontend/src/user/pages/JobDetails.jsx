import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Icon from '../components/common/Icon';
import { jobsApi, applicationsApi } from '../../api/index';
import { formatJobPostedAgoFromJob } from '../../utils/jobDates';

function CompanyLogo({ name = 'T' }) {
  const first = (name || 'T')[0];
  return (
    <div style={{ width: 68, height: 68, borderRadius: 16, background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 28, flexShrink: 0 }}>
      {first}
    </div>
  );
}

const arr = (v) => Array.isArray(v) ? v : [];

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    setLoading(true);
    jobsApi.get(id)
      .then((data) => { setJob(data); setError(''); })
      .catch((e) => setError(e.message || 'Could not load this job'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!job?.id) return;
    setApplying(true);
    try {
      const res = await applicationsApi.apply(Number(job.id), coverLetter);
      navigate('/user/apply/success', { state: { job, applicationId: res?.id } });
    } catch (e) {
      alert(e.message || 'Could not submit application');
    } finally {
      setApplying(false);
      setShowModal(false);
    }
  };

  if (loading) return <AppLayout><div className="page-wrapper"><div className="card" style={{ padding: 28 }}>Loading job...</div></div></AppLayout>;
  if (error || !job) return <AppLayout><div className="page-wrapper"><div className="card" style={{ padding: 28, color: 'var(--danger)' }}>{error || 'Job not found'}</div></div></AppLayout>;

  const cleanLocation = (job.location || '').replace(', Saudi Arabia', '');
  const skills = arr(job.skills);
  const responsibilities = arr(job.responsibilities);
  const qualifications = arr(job.qualifications);
  const benefits = arr(job.benefits);
  const languages = arr(job.languages);
  const postedLabel = formatJobPostedAgoFromJob(job);

  const InfoRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name={icon} size={14} /> {label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );

  return (
    <AppLayout>
      <div className="page-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', gap: 4 }} onClick={() => navigate('/user/jobs')}><Icon name="chevronLeft" size={16} /> Jobs</button>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{job.title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }} className="details-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 18, marginBottom: 20, flexWrap: 'wrap' }}>
                <CompanyLogo name={job.company} />
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>{job.title}</h1>
                  <div style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 12 }}>{job.company}</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-secondary)' }}>
                    <span><Icon name="location" size={15} /> {cleanLocation}</span>
                    <span><Icon name="briefcase" size={15} /> {job.type}</span>
                    <span><Icon name="building" size={15} /> {job.remote}</span>
                    <span><Icon name="trending" size={15} /> {job.experienceRequired || job.experience || 'Open'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                {skills.map(s => <span key={s} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 13, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600, border: '1px solid #C7D2FE' }}>{s}</span>)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, background: 'var(--surface-2)', borderRadius: 12, padding: '16px 20px' }}>
                {[{ icon: 'company', label: 'Industry', value: job.industry }, { icon: 'users', label: 'Company Size', value: job.companySize }, { icon: 'calendar', label: 'Posted', value: postedLabel }, { icon: 'timer', label: 'Deadline', value: job.deadline }].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: 'var(--text-muted)' }}><Icon name={item.icon} size={18} /></div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3 }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            <Section title="About this Role"><p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{job.description || 'No description available yet.'}</p></Section>
            <ListSection title="Key Responsibilities" items={responsibilities} />
            <ListSection title="Qualifications" items={qualifications.length ? qualifications : skills} />
            <ListSection title="Benefits & Perks" items={benefits} />
            <Section title="Languages Required"><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{languages.length ? languages.map(l => <span key={l} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#EDF6FB', color: 'var(--info)', border: '1px solid #BAE6FD' }}>{l}</span>) : <span>Not specified</span>}</div></Section>
          </div>

          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <InfoRow icon="location" label="Location" value={cleanLocation} />
                <InfoRow icon="building" label="Work Type" value={job.remote} />
                <InfoRow icon="briefcase" label="Employment" value={job.type} />
                <InfoRow icon="trending" label="Experience" value={job.experienceRequired || job.experience} />
                <InfoRow icon="timer" label="Deadline" value={job.deadline} />
              </div>
              <button className="btn btn-gradient btn-lg" style={{ width: '100%', marginBottom: 10 }} onClick={() => setShowModal(true)} disabled={applying}>{applying ? 'Submitting...' : 'Apply Now'}</button>
              <button className={`btn btn-lg ${saved ? 'btn-secondary' : 'btn-outline'}`} style={{ width: '100%' }} onClick={() => setSaved(s => !s)}><Icon name={saved ? 'bookmarkCheck' : 'bookmark'} size={16} /> {saved ? 'Saved' : 'Save Job'}</button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 'min(560px, 92vw)', padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Apply for {job.title}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>Your application will be sent directly to HR and will appear in HR Candidates / Applications.</p>
            <textarea className="form-input" rows={7} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Optional cover letter..." style={{ width: '100%', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={applying}>Cancel</button>
              <button className="btn btn-gradient" onClick={handleApply} disabled={applying}>{applying ? 'Submitting...' : 'Submit Application'}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function Section({ title, children }) {
  return <div className="card" style={{ padding: 28 }}><h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>{title}</h2>{children}</div>;
}
function ListSection({ title, items }) {
  return <Section title={title}>{items?.length ? <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{items.map((r, i) => <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><span style={{ color: 'var(--primary)', fontWeight: 900 }}>✓</span><span style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r}</span></li>)}</ul> : <p style={{ color: 'var(--text-secondary)' }}>Not specified.</p>}</Section>;
}
