import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Icon from '../components/common/Icon';

export default function ApplicationSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const job = state?.job;
  const [appId] = useState(`TF-${Math.floor(100000 + Math.random() * 900000)}`);

  useEffect(() => {
    const r = setTimeout(() => navigate('/user/applications'), 9000);
    return () => clearTimeout(r);
  }, [navigate]);

  const steps = [
    { icon: 'fileCheck', title: 'Application Received', desc: 'Your application is now with the recruiter.', done: true },
    { icon: 'eye', title: 'CV Review', desc: 'The hiring team will review your profile within 3–5 business days.', done: false },
    { icon: 'phone', title: 'Initial Screening', desc: 'If shortlisted, you will be contacted for a screening call.', done: false },
    { icon: 'users', title: 'Interviews', desc: 'Technical and cultural fit interviews with the team.', done: false },
    { icon: 'award', title: 'Decision', desc: 'You will receive the hiring decision and next steps.', done: false },
  ];

  return (
    <AppLayout>
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
          {/* Success animation */}
          <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 28px' }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669, #0D9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 20px 40px rgba(5,150,105,0.3)',
            }}>
              <Icon name="check" size={48} strokeWidth={2.5} />
            </div>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Application Submitted
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28, maxWidth: 460, margin: '0 auto 28px' }}>
            Your application for <strong style={{ color: 'var(--text-primary)' }}>{job?.title || 'this position'}</strong> at <strong style={{ color: 'var(--text-primary)' }}>{job?.company || 'the company'}</strong> has been submitted successfully.
          </p>

          {/* Application ID */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 24px', background: 'var(--primary-light)', borderRadius: 12, border: '1px solid #C7D2FE', marginBottom: 32 }}>
            <span style={{ color: 'var(--primary)' }}><Icon name="fileCheck" size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Application Reference</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.02em' }}>{appId}</div>
            </div>
          </div>

          {/* Next steps */}
          <div className="card" style={{ padding: '28px 32px', marginBottom: 24, textAlign: 'left' }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: 'var(--text-primary)' }}>What happens next</h3>
            <div className="timeline">
              {steps.map((step, i, arr) => (
                <div key={i} className="timeline-item" style={{ position: 'relative', paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                  {i < arr.length - 1 && <div className="timeline-line" />}
                  <div className={`timeline-dot ${step.done ? 'success' : ''}`} style={{ width: 36, height: 36 }}>
                    <Icon name={step.done ? 'check' : step.icon} size={16} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title" style={{ fontWeight: step.done ? 700 : 600, color: step.done ? 'var(--success)' : 'var(--text-primary)' }}>{step.title}</div>
                    <div className="timeline-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28, textAlign: 'left' }}>
            {[
              { icon: 'bell', title: 'Stay Updated', desc: 'Check your notifications for status changes.' },
              { icon: 'linkedin', title: 'Connect', desc: 'Follow the company and recruiter on LinkedIn.' },
            ].map((tip, i) => (
              <div key={i} style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--primary)', marginBottom: 6 }}><Icon name={tip.icon} size={20} /></div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{tip.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/user/applications')}>Track Applications</button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/user/jobs')}>Browse More Jobs</button>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
            Redirecting to My Applications shortly...
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
