import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { skillOptions, languageOptions, saudiCities, nationalityOptions } from '../data/mockData';
import Icon from '../components/common/Icon';

const steps = [
  { id: 1, label: 'Personal', icon: 'user' },
  { id: 2, label: 'Professional', icon: 'briefcase' },
  { id: 3, label: 'Education', icon: 'education' },
  { id: 4, label: 'Skills', icon: 'zap' },
  { id: 5, label: 'Preferences', icon: 'target' },
];

const cityChoices = saudiCities.filter(c => c !== 'All Cities');

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    nationality: 'Saudi',
    location: '',
    linkedin: '',
    portfolio: '',
    yearsOfExperience: '',
    degree: '',
    university: '',
    graduationYear: '',
    skills: [],
    languages: ['Arabic', 'English'],
    availability: '1 Month',
    workArrangement: 'Any',
    travelWillingness: false,
    resumeFile: null,
  });

  const toggleSkill = (s) => setForm(f => ({
    ...f,
    skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s],
  }));

  const toggleLang = (l) => setForm(f => ({
    ...f,
    languages: f.languages.includes(l) ? f.languages.filter(x => x !== l) : [...f.languages, l],
  }));

  const handleNext = () => { if (step < 5) setStep(s => s + 1); };
  const handleBack = () => { if (step > 1) setStep(s => s - 1); };

  const handleFinish = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    // Seed the structured education array from the degree fields so the Profile
    // page's Education section reflects what was entered during onboarding.
    const education = form.degree
      ? [{ id: `edu_${Date.now()}`, degree: form.degree, university: form.university, graduationYear: form.graduationYear }]
      : [];
    updateUser({
      ...form,
      education,
      profileCompletion: 85,
      resumeFile: form.resumeFile?.name || 'CV.pdf',
    });
    navigate('/user/dashboard');
  };

  const Field = ({ label, children, hint }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white', fontWeight: 800 }}>T</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>TalentFlow</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Profile Setup · Step {step} of {steps.length}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/user/dashboard')} style={{ fontSize: 13, color: 'var(--text-muted)' }}>Skip for now</button>
      </div>

      {/* Progress */}
      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', width: `${(step / steps.length) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ flex: 1, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
          {steps.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                background: step === s.id ? 'var(--primary)' : step > s.id ? 'var(--success-light)' : 'var(--surface-2)',
                color: step === s.id ? '#fff' : step > s.id ? 'var(--success)' : 'var(--text-muted)',
                transition: 'all 0.3s',
              }}>
                <Icon name={step > s.id ? 'check' : s.icon} size={15} />
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div style={{ width: 24, height: 2, background: step > s.id ? 'var(--success)' : 'var(--border)', borderRadius: 1 }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ width: '100%', maxWidth: 600, padding: '36px 40px', animation: 'fadeIn 0.3s ease' }}>

          {/* Step 1: Personal */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Personal Information</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>Tell us the basics so recruiters can reach you</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Full Name"><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Mohammed Alrashidi" /></Field>
                <Field label="Email Address"><input className="form-input" value={form.email} type="email" onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@email.com" /></Field>
                <Field label="Phone Number" hint="Saudi mobile format"><input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+966 5X XXX XXXX" /></Field>
                <Field label="Nationality">
                  <select className="form-input form-select" value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}>
                    {nationalityOptions.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                <div style={{ gridColumn: '1/-1' }}>
                  <Field label="City">
                    <select className="form-input form-select" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
                      <option value="">Select your city</option>
                      {cityChoices.map(c => <option key={c} value={`${c}, Saudi Arabia`}>{c}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Professional */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Professional Information</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>Share your professional links and experience</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="LinkedIn Profile"><input className="form-input" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="linkedin.com/in/your-name" /></Field>
                <Field label="Portfolio / Website (optional)"><input className="form-input" value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))} placeholder="your-website.com" /></Field>
                <Field label="Years of Experience">
                  <select className="form-input form-select" value={form.yearsOfExperience} onChange={e => setForm(f => ({ ...f, yearsOfExperience: e.target.value }))}>
                    <option value="">Select experience level</option>
                    <option value="0">Fresh graduate (0-1 year)</option>
                    <option value="2">2-3 years</option>
                    <option value="4">4-6 years</option>
                    <option value="7">7-10 years</option>
                    <option value="10">10+ years</option>
                  </select>
                </Field>
                <Field label="Upload CV / Resume" hint="PDF or DOCX, max 10MB">
                  <div
                    style={{
                      border: '2px dashed var(--border)', borderRadius: 10, padding: '24px', textAlign: 'center',
                      cursor: 'pointer', transition: 'all 0.2s', background: form.resumeFile ? 'var(--success-light)' : 'var(--surface-2)',
                    }}
                    onClick={() => document.getElementById('resume-upload').click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); setForm(f => ({ ...f, resumeFile: e.dataTransfer.files[0] })); }}
                  >
                    <input id="resume-upload" type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={e => setForm(f => ({ ...f, resumeFile: e.target.files[0] }))} />
                    {form.resumeFile ? (
                      <div style={{ color: 'var(--success)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Icon name="fileCheck" size={28} /></div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{form.resumeFile.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Click to replace</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: 'var(--text-muted)' }}><Icon name="upload" size={28} /></div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>Drop your CV here</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to browse files</div>
                      </>
                    )}
                  </div>
                </Field>
              </div>
            </>
          )}

          {/* Step 3: Education */}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Education</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>Your highest completed qualification</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Degree / Qualification">
                  <select className="form-input form-select" value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))}>
                    <option value="">Select degree</option>
                    <option value="High School">High School (Thanawiyya)</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Bachelor of Science">Bachelor of Science (BSc)</option>
                    <option value="Bachelor of Arts">Bachelor of Arts (BA)</option>
                    <option value="Bachelor of Engineering">Bachelor of Engineering (BEng)</option>
                    <option value="Master of Science">Master of Science (MSc)</option>
                    <option value="Master of Business Administration">MBA</option>
                    <option value="Doctor of Philosophy">PhD / Doctorate</option>
                  </select>
                </Field>
                <Field label="University / Institution">
                  <input className="form-input" value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} list="uni-list" placeholder="e.g. King Saud University" />
                  <datalist id="uni-list">
                    <option value="King Saud University" />
                    <option value="King Abdulaziz University" />
                    <option value="King Fahd University of Petroleum and Minerals" />
                    <option value="Imam Mohammad Ibn Saud Islamic University" />
                    <option value="Princess Nourah bint Abdulrahman University" />
                    <option value="King Abdullah University of Science and Technology (KAUST)" />
                    <option value="Prince Sultan University" />
                  </datalist>
                </Field>
                <Field label="Graduation Year">
                  <select className="form-input form-select" value={form.graduationYear} onChange={e => setForm(f => ({ ...f, graduationYear: e.target.value }))}>
                    <option value="">Select year</option>
                    {Array.from({ length: 30 }, (_, i) => 2026 - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}

          {/* Step 4: Skills */}
          {step === 4 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Skills & Languages</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>Select the skills and languages you’re proficient in</p>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Skills ({form.skills.length} selected)</label>
                <div className="chip-select" style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
                  {skillOptions.map(s => (
                    <button key={s} type="button" className={`chip ${form.skills.includes(s) ? 'selected' : ''}`} onClick={() => toggleSkill(s)}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Languages ({form.languages.length} selected)</label>
                <div className="chip-select" style={{ marginTop: 8 }}>
                  {languageOptions.map(l => (
                    <button key={l} type="button" className={`chip ${form.languages.includes(l) ? 'selected' : ''}`} onClick={() => toggleLang(l)}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 5: Preferences */}
          {step === 5 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Preferences</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>Help us match you with the right opportunities</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                    {['Immediate', '2 Weeks', '1 Month', '3 Months'].map(a => (
                      <button
                        key={a} type="button"
                        onClick={() => setForm(f => ({ ...f, availability: a }))}
                        style={{
                          padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          border: `2px solid ${form.availability === a ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.availability === a ? 'var(--primary-light)' : '#fff',
                          color: form.availability === a ? 'var(--primary)' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                        }}
                      >{a}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Work Arrangement Preference</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                    {['Onsite', 'Hybrid', 'Remote', 'Any'].map(a => (
                      <button
                        key={a} type="button"
                        onClick={() => setForm(f => ({ ...f, workArrangement: a }))}
                        style={{
                          padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          border: `2px solid ${form.workArrangement === a ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.workArrangement === a ? 'var(--primary-light)' : '#fff',
                          color: form.workArrangement === a ? 'var(--primary)' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                        }}
                      >{a}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Willing to relocate within the Kingdom?</label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(opt => (
                      <button
                        key={String(opt.val)} type="button"
                        onClick={() => setForm(f => ({ ...f, travelWillingness: opt.val }))}
                        style={{
                          padding: '10px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          border: `2px solid ${form.travelWillingness === opt.val ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.travelWillingness === opt.val ? 'var(--primary-light)' : '#fff',
                          color: form.travelWillingness === opt.val ? 'var(--primary)' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                        }}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ background: 'var(--primary-light)', borderRadius: 12, padding: '20px 24px', border: '1px solid #C7D2FE' }}>
                  <h4 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 12, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="checkCircle" size={16} /> Profile Summary
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Name', value: form.name || '—' },
                      { label: 'City', value: form.location || '—' },
                      { label: 'Nationality', value: form.nationality || '—' },
                      { label: 'Experience', value: form.yearsOfExperience ? `${form.yearsOfExperience} years` : '—' },
                      { label: 'Skills', value: form.skills.length ? `${form.skills.length} selected` : '—' },
                      { label: 'Availability', value: form.availability },
                    ].map(item => (
                      <div key={item.label} style={{ fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}: </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={handleBack} disabled={step === 1} style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>
              <Icon name="chevronLeft" size={16} /> Back
            </button>
            {step < 5 ? (
              <button className="btn btn-primary" onClick={handleNext}>Continue <Icon name="chevronRight" size={16} /></button>
            ) : (
              <button className="btn btn-gradient btn-lg" onClick={handleFinish} disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="spinner" size={16} className="animate-spin" /> Saving profile...
                  </span>
                ) : 'Complete Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
