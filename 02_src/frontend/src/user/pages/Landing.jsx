import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon';

const features = [
  { icon: 'target', title: 'Smart Job Matching', desc: 'Our matching engine analyzes your skills and experience to surface relevant roles across the Kingdom.' },
  { icon: 'zap', title: 'Apply in Minutes', desc: 'Build your profile once and apply to multiple employers without re-entering your details each time.' },
  { icon: 'chart', title: 'Application Tracking', desc: 'Follow every application through each stage, from review to offer, in one place.' },
  { icon: 'trending', title: 'Career Insights', desc: 'Receive skill recommendations aligned with demand in the Saudi job market.' },
  { icon: 'message', title: 'Connect With Recruiters', desc: 'Communicate directly with talent teams at leading Saudi employers.' },
  { icon: 'shield', title: 'Your Data, Protected', desc: 'You control who sees your profile, with privacy standards built for the region.' },
];

const stats = [
  { value: '120K+', label: 'Active Candidates' },
  { value: '850+', label: 'Saudi Employers' },
  { value: '9,400+', label: 'Open Positions' },
  { value: '92%', label: 'Candidate Satisfaction' },
];

const testimonials = [
  {
    name: 'Abdulrahman Al-Mutairi', role: 'Software Engineer at Elm', avatar: 'AM',
    text: 'TalentFlow made my job search far more organized. I could track every application and finally landed a role at Elm in Riyadh.',
    rating: 5, color: '#4F46E5',
  },
  {
    name: 'Layla Al-Zahrani', role: 'Data Analyst at Riyad Bank', avatar: 'LZ',
    text: 'The platform matched me with banking analytics roles that genuinely fit my background. The process felt professional from start to finish.',
    rating: 5, color: '#7C3AED',
  },
  {
    name: 'Faisal Al-Shehri', role: 'Cybersecurity Analyst at Aramco', avatar: 'FS',
    text: 'Clear application stages and timely updates. I always knew where I stood, which made preparing for interviews much easier.',
    rating: 5, color: '#0EA5A4',
  },
];

const companies = ['Aramco', 'STC', 'Elm', 'SDAIA', 'NEOM', 'SABIC', 'Riyad Bank', 'Mobily', 'Tamara', 'Saudia'];

export default function Landing() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 20 ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrollY > 20 ? 'blur(12px)' : 'none',
        borderBottom: scrollY > 20 ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        padding: '0 40px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'white', fontWeight: 800,
          }}>T</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: scrollY > 20 ? 'var(--text-primary)' : '#fff', letterSpacing: '-0.02em' }}>TalentFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost" style={{ color: scrollY > 20 ? 'var(--text-secondary)' : 'rgba(255,255,255,0.85)' }} onClick={() => navigate('/user/login')}>Log In</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/user/register')}>Create Account</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 45%, #312E81 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '15%', left: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 800, animation: 'fadeIn 0.8s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: 'rgba(79,70,229,0.25)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 99, marginBottom: 28 }}>
            <Icon name="badge" size={15} color="#A5B4FC" />
            <span style={{ fontSize: 14, color: '#A5B4FC', fontWeight: 600 }}>Saudi Arabia’s Career Platform</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 900, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Find Your Next Role at<br />
            <span style={{ background: 'linear-gradient(135deg, #818CF8, #A78BFA, #C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              the Kingdom’s Top Employers
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            TalentFlow connects Saudi professionals with leading employers across Riyadh, Jeddah, Dammam, and beyond. Build your profile, apply with confidence, and track every step.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <button className="btn btn-xl btn-gradient" onClick={() => navigate('/user/register')} style={{ fontSize: 16, padding: '16px 36px' }}>
              Get Started <Icon name="arrowRight" size={18} />
            </button>
            <button
              className="btn btn-xl"
              onClick={() => navigate('/user/login')}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', fontSize: 16, padding: '16px 32px', backdropFilter: 'blur(4px)' }}
            >
              Log In
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 16 }}>Free for job seekers · No credit card required</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 56, flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies */}
      <section style={{ padding: '48px 40px', background: '#F8FAFC', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>Trusted by leading Saudi employers</p>
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap' }}>
          {companies.map(c => (
            <span key={c} style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '-0.01em', opacity: 0.6 }}>{c}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '96px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-block', padding: '5px 16px', background: 'var(--primary-light)', borderRadius: 99, fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>Features</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 16 }}>Everything you need to advance<br />your career</h2>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>A complete toolkit built for professionals in the Saudi job market.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} className="card card-hover" style={{ padding: 28, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, background: 'var(--primary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)' }}>
                <Icon name={f.icon} size={22} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why TalentFlow */}
      <section style={{ padding: '80px 40px', background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="why-grid">
          <div>
            <div style={{ display: 'inline-block', padding: '5px 16px', background: 'rgba(99,102,241,0.2)', borderRadius: 99, fontSize: 12, fontWeight: 700, color: '#A5B4FC', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>Why TalentFlow</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1.2 }}>Built for the Saudi job market</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 32 }}>From Vision 2030 giga-projects to established national employers, TalentFlow brings the Kingdom’s opportunities into one professional, transparent platform.</p>
            {[
              'Roles from Aramco, STC, Elm, SDAIA, NEOM and more',
              'Arabic and English interface support',
              'Transparent application stages and updates',
              'Skill recommendations aligned with local demand',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 22, height: 22, background: 'rgba(99,102,241,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#A5B4FC' }}>
                  <Icon name="check" size={13} />
                </div>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
            <button className="btn btn-gradient btn-lg" style={{ marginTop: 20 }} onClick={() => navigate('/user/register')}>Create Your Profile</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { icon: 'target', title: 'Relevant Matches', value: '92%', desc: 'Match relevance' },
              { icon: 'timer', title: 'Faster Applying', value: '< 3 min', desc: 'Average apply time' },
              { icon: 'briefcase', title: 'Open Roles', value: '9,400+', desc: 'Across the Kingdom' },
              { icon: 'company', title: 'Employers', value: '850+', desc: 'Saudi organizations' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px 20px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, color: '#A5B4FC' }}><Icon name={s.icon} size={26} /></div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '96px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-block', padding: '5px 16px', background: 'var(--primary-light)', borderRadius: 99, fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>Testimonials</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Trusted by professionals across the Kingdom</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {testimonials.map((t, i) => (
            <div key={i} className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 16, color: '#F59E0B' }}>
                {Array(t.rating).fill(0).map((_, j) => <Icon key={j} name="star" size={16} style={{ fill: '#F59E0B' }} />)}
              </div>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>“{t.text}”</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>Ready to take the next step?</h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>Join thousands of Saudi professionals building their careers with TalentFlow.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-white btn-xl" onClick={() => navigate('/user/register')}>Create Free Account</button>
          <button
            className="btn btn-xl"
            onClick={() => navigate('/user/login')}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}
          >
            Log In
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 40px', background: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'white', fontWeight: 800 }}>T</div>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: 16 }}>TalentFlow</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>© 2026 TalentFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
