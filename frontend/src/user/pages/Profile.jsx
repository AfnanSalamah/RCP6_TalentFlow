import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { skillOptions, languageOptions } from '../data/mockData';
import Icon from '../components/common/Icon';
import { profileApi, resumeApi } from '../../api/index';

const genId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editSection, setEditSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [apiProfile, setApiProfile] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    headline: user?.headline || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    location: user?.location || '',
    linkedin: user?.linkedin || '',
    portfolio: user?.portfolio || '',
    skills: user?.skills || [],
    languages: user?.languages || [],
    availability: user?.availability || '',
  });

  const [resumes,           setResumes]           = useState([]);
  const [extractionPreview, setExtractionPreview] = useState(null); // AI-extracted data from upload
  const [uploadingResume,   setUploadingResume]   = useState(false);
  const [uploadMsg,         setUploadMsg]         = useState('');

  useEffect(() => {
    profileApi.get()
      .then(data => {
        setApiProfile(data);
        setForm(f => ({
          ...f,
          name:         data.name         || f.name,
          headline:     data.headline     || f.headline,
          bio:          data.bio          || f.bio,
          phone:        data.phone        || f.phone,
          location:     data.location     || f.location,
          linkedin:     data.linkedin     || f.linkedin,
          portfolio:    data.portfolio    || f.portfolio,
          skills:       data.skills?.length    ? data.skills    : f.skills,
          languages:    data.languages?.length ? data.languages : f.languages,
          availability: data.availability || f.availability,
        }));
        updateUser({
          profileCompletion: data.profile_completion,
          skills: data.skills || [],
          languages: data.languages || [],
          phone: data.phone,
          location: data.location,
          headline: data.headline,
          bio: data.bio,
        });
      })
      .catch(() => null);
    resumeApi.list()
      .then(list => setResumes(Array.isArray(list) ? list : []))
      .catch(() => null);
  }, []);

  const experiences = apiProfile?.experiences || user?.experiences || [];
  const education   = apiProfile?.education   || user?.education   || [];
  const certifications = apiProfile?.certifications || user?.certifications || [];
  const projects = apiProfile?.projects || user?.projects || [];

  const [expModal, setExpModal] = useState(null);
  const [eduModal, setEduModal] = useState(null);

  const saveExperience = async (entry) => {
    try {
      if (entry.id && !String(entry.id).startsWith('exp_')) {
        const updated = await profileApi.updateExperience(entry.id, entry);
        setApiProfile(p => ({ ...p, experiences: (p?.experiences || []).map(e => e.id === entry.id ? updated : e) }));
      } else {
        const created = await profileApi.addExperience(entry);
        setApiProfile(p => ({ ...p, experiences: [...(p?.experiences || []), created] }));
      }
    } catch {
      updateUser({ experiences: entry.id ? experiences.map(e => e.id === entry.id ? entry : e) : [...experiences, { ...entry, id: genId('exp') }] });
    }
    setExpModal(null);
  };

  const deleteExperience = async (id) => {
    try {
      if (!String(id).startsWith('exp_')) await profileApi.deleteExperience(id);
      setApiProfile(p => ({ ...p, experiences: (p?.experiences || []).filter(e => e.id !== id) }));
      updateUser({ experiences: experiences.filter(e => e.id !== id) });
    } catch {
      updateUser({ experiences: experiences.filter(e => e.id !== id) });
    }
  };

  const saveEducation = async (entry) => {
    try {
      if (entry.id && !String(entry.id).startsWith('edu_')) {
        const updated = await profileApi.updateEducation(entry.id, entry);
        setApiProfile(p => ({ ...p, education: (p?.education || []).map(e => e.id === entry.id ? updated : e) }));
      } else {
        const created = await profileApi.addEducation(entry);
        setApiProfile(p => ({ ...p, education: [...(p?.education || []), created] }));
      }
    } catch {
      updateUser({ education: entry.id ? education.map(e => e.id === entry.id ? entry : e) : [...education, { ...entry, id: genId('edu') }] });
    }
    setEduModal(null);
  };

  const deleteEducation = async (id) => {
    try {
      if (!String(id).startsWith('edu_')) await profileApi.deleteEducation(id);
      setApiProfile(p => ({ ...p, education: (p?.education || []).filter(e => e.id !== id) }));
      updateUser({ education: education.filter(e => e.id !== id) });
    } catch {
      updateUser({ education: education.filter(e => e.id !== id) });
    }
  };

  const initials = (form.name || user?.name || 'MA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const toggleSkill = (s) => setForm(f => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s] }));
  const toggleLang = (l) => setForm(f => ({ ...f, languages: f.languages.includes(l) ? f.languages.filter(x => x !== l) : [...f.languages, l] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profileApi.update(form);
      setApiProfile(updated);
      updateUser({ ...form, profile_completion: updated.profile_completion });
    } catch {
      updateUser(form);
    } finally {
      setSaving(false);
      setEditSection(null);
    }
  };

  const SectionHeader = ({ title, section }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ fontWeight: 700, fontSize: 16 }}>{title}</h3>
      <button
        className="btn btn-ghost btn-sm"
        style={{ color: editSection === section ? 'var(--error)' : 'var(--primary)', fontWeight: 600, gap: 5 }}
        onClick={() => setEditSection(editSection === section ? null : section)}
      >
        {editSection === section ? <><Icon name="close" size={14} /> Cancel</> : <><Icon name="edit" size={14} /> Edit</>}
      </button>
    </div>
  );

  return (
    <AppLayout title="My Profile" subtitle="Manage your professional profile">
      <div className="page-wrapper">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }} className="details-grid">
          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Profile header */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: '#fff', fontWeight: 900, border: '4px solid white', boxShadow: '0 4px 12px rgba(79,70,229,0.3)', overflow: 'hidden' }}>
                    {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                  </div>
                  <button title="Change photo" onClick={() => document.getElementById('avatar-upload').click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><Icon name="edit" size={12} /></button>
                  <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) updateUser({ avatar: URL.createObjectURL(f) }); }} />
                </div>
                <div style={{ flex: 1 }}>
                  {editSection === 'basic' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name" />
                      <input className="form-input" value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="Professional Headline" />
                      <textarea className="form-input form-textarea" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Short professional bio..." style={{ minHeight: 80 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditSection(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{user?.name}</h1>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'var(--success-light)', color: 'var(--success)' }}><Icon name="check" size={12} /> Open to Work</span>
                      </div>
                      <p style={{ fontSize: 15, color: 'var(--primary)', fontWeight: 600, marginBottom: 6 }}>{user?.headline}</p>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{user?.bio}</p>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="location" size={14} /> {user?.location}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="briefcase" size={14} /> {user?.yearsOfExperience} years experience</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="education" size={14} /> {user?.university}</span>
                      </div>
                    </>
                  )}
                </div>
                {editSection !== 'basic' && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 600, gap: 5 }} onClick={() => setEditSection('basic')}><Icon name="edit" size={14} /> Edit</button>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="card" style={{ padding: 28 }}>
              <SectionHeader title="Contact & Links" section="contact" />
              {editSection === 'contact' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">LinkedIn</label><input className="form-input" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Portfolio</label><input className="form-input" value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))} /></div>
                  <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditSection(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { icon: 'mail', label: 'Email', value: user?.email },
                    { icon: 'phone', label: 'Phone', value: user?.phone },
                    { icon: 'location', label: 'City', value: user?.location },
                    { icon: 'globe', label: 'Nationality', value: user?.nationality },
                    { icon: 'linkedin', label: 'LinkedIn', value: user?.linkedin },
                    { icon: 'globe', label: 'Portfolio', value: user?.portfolio },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <span style={{ flexShrink: 0, color: 'var(--text-muted)', marginTop: 2 }}><Icon name={item.icon} size={17} /></span>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{item.value || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work Experience */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>Work Experience</h3>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 600, gap: 5 }} onClick={() => setExpModal({ mode: 'add', data: { title: '', company: '', startYear: '', endYear: '', description: '' } })}>
                  <Icon name="plus" size={14} /> Add
                </button>
              </div>
              {experiences.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No work experience added yet.
                  <div><button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setExpModal({ mode: 'add', data: { title: '', company: '', startYear: '', endYear: '', description: '' } })}><Icon name="plus" size={15} /> Add Experience</button></div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {experiences.map((exp, i) => (
                    <div key={exp.id} style={{ display: 'flex', gap: 16, paddingBottom: 24, borderBottom: i < experiences.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, hsl(${(exp.company.charCodeAt(0) || 65) * 5 % 360}, 55%, 50%), hsl(${(exp.company.charCodeAt(0) || 65) * 7 % 360}, 60%, 42%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                        {exp.company?.[0] || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{exp.title}</div>
                            <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{exp.company}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--text-muted)', padding: 6 }} title="Edit" onClick={() => setExpModal({ mode: 'edit', data: exp })}><Icon name="edit" size={15} /></button>
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--error)', padding: 6 }} title="Delete" onClick={() => deleteExperience(exp.id)}><Icon name="trash" size={15} /></button>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="calendar" size={13} /> {exp.startYear} – {exp.endYear}</div>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>Education</h3>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 600, gap: 5 }} onClick={() => setEduModal({ mode: 'add', data: { degree: '', university: '', graduationYear: '', gpa: '', gpaScale: '4.0' } })}>
                  <Icon name="plus" size={14} /> Add
                </button>
              </div>
              {education.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No education added yet.
                  <div><button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setEduModal({ mode: 'add', data: { degree: '', university: '', graduationYear: '', gpa: '', gpaScale: '4.0' } })}><Icon name="plus" size={15} /> Add Education</button></div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {education.map((edu, i) => (
                    <div key={edu.id} style={{ display: 'flex', gap: 16, paddingBottom: i < education.length - 1 ? 20 : 0, borderBottom: i < education.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}><Icon name="education" size={22} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{edu.degree}</div>
                            <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{edu.university}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Graduated {edu.graduationYear}</div>
                              {edu.gpa && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid #C7D2FE' }}>
                                  <Icon name="award" size={12} /> GPA: {edu.gpa} / {edu.gpaScale || '4.0'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--text-muted)', padding: 6 }} title="Edit" onClick={() => setEduModal({ mode: 'edit', data: edu })}><Icon name="edit" size={15} /></button>
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--error)', padding: 6 }} title="Delete" onClick={() => deleteEducation(edu.id)}><Icon name="trash" size={15} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="card" style={{ padding: 28 }}>
              <SectionHeader title="Skills" section="skills" />
              {editSection === 'skills' ? (
                <>
                  <div className="chip-select" style={{ marginBottom: 20, maxHeight: 240, overflowY: 'auto' }}>
                    {skillOptions.map(s => (
                      <button key={s} type="button" className={`chip ${form.skills.includes(s) ? 'selected' : ''}`} onClick={() => toggleSkill(s)}>{s}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Skills'}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditSection(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(apiProfile?.skills || form.skills || []).map(s => (
                    <span key={s} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600, border: '1px solid #C7D2FE' }}>{s}</span>
                  ))}
                  {(apiProfile?.skills || form.skills || []).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No skills added yet</span>}
                </div>
              )}
            </div>

            {/* Languages */}
            <div className="card" style={{ padding: 28 }}>
              <SectionHeader title="Languages" section="languages" />
              {editSection === 'languages' ? (
                <>
                  <div className="chip-select" style={{ marginBottom: 16 }}>
                    {languageOptions.map(l => (
                      <button key={l} type="button" className={`chip ${form.languages.includes(l) ? 'selected' : ''}`} onClick={() => toggleLang(l)}>{l}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditSection(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(apiProfile?.languages || form.languages || []).map(l => (
                    <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 13, background: '#EDF6FB', color: 'var(--info)', fontWeight: 600, border: '1px solid #BAE6FD' }}><Icon name="languages" size={14} /> {l}</span>
                  ))}
                  {(apiProfile?.languages || form.languages || []).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No languages added yet</span>}
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Certifications</h3>
              {certifications.length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No certifications added yet</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {certifications.map((cert) => (
                    <div key={cert.id || cert.name} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{cert.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{[cert.issuer, cert.year].filter(Boolean).join(' · ')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Projects</h3>
              {projects.length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No projects added yet</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {projects.map((project) => (
                    <div key={project.id || project.name} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{project.name}</div>
                      {project.description && <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>{project.description}</p>}
                      {project.technologies?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {project.technologies.map((tech) => <span key={tech} style={{ padding: '3px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#ECFDF5', color: '#047857' }}>{tech}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile completion — real data */}
            {(() => {
              const pct = apiProfile?.profile_completion ?? user?.profileCompletion ?? 0;
              const exp = (apiProfile?.experiences || []).length > 0;
              const edu = (apiProfile?.education || []).length > 0;
              const ski = (apiProfile?.skills || form.skills || []).length > 0;
              const lng = (apiProfile?.languages || form.languages || []).length > 0;
              const checkItems = [
                { label: 'Basic info',       done: !!(form.name && form.headline) },
                { label: 'Contact details',  done: !!(form.phone || form.location) },
                { label: 'Work experience',  done: exp },
                { label: 'Education',        done: edu },
                { label: 'Skills',           done: ski },
                { label: 'Languages',        done: lng },
                { label: 'CV uploaded',      done: resumes.length > 0 },
              ];
              const label = pct >= 80 ? 'Strong' : pct >= 50 ? 'Good' : pct >= 20 ? 'Getting started' : 'New account';
              const hint  = pct < 100 ? 'Keep adding info to reach 100%' : 'Profile complete!';
              return (
                <div className="card" style={{ padding: 22 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Profile Completion</h3>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="32" cy="32" r="27" fill="none" stroke="var(--border)" strokeWidth="5" />
                        <circle cx="32" cy="32" r="27" fill="none" stroke="#0A4174" strokeWidth="5"
                          strokeDasharray={`${2 * Math.PI * 27}`}
                          strokeDashoffset={`${2 * Math.PI * 27 * (1 - pct / 100)}`}
                          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{pct}%</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{hint}</div>
                    </div>
                  </div>
                  {checkItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: item.done ? 'var(--success-light)' : 'var(--surface-2)', border: `2px solid ${item.done ? 'var(--success)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--success)' }}>
                        {item.done && <Icon name="check" size={9} />}
                      </div>
                      <span style={{ fontSize: 12, color: item.done ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: item.done ? 'line-through' : 'none', fontWeight: item.done ? 400 : 500 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* CV / Resume — real data */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>CV / Resume</h3>
              {resumes.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', background: 'var(--surface-2)', borderRadius: 10, marginBottom: 12, border: '1px dashed var(--border)' }}>
                  <Icon name="file" size={22} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>No CV uploaded yet</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upload your resume to get started</div>
                </div>
              ) : (
                resumes.slice(0, 1).map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, marginBottom: 12, border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--primary)' }}><Icon name="file" size={24} /></span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.file_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {r.ats_score ? `ATS Score: ${Math.round(r.ats_score)}%` : 'Uploaded'}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <button
                className="btn btn-outline btn-sm"
                style={{ width: '100%' }}
                disabled={uploadingResume}
                onClick={() => document.getElementById('resume-upload-sidebar').click()}
              >
                <Icon name={resumes.length > 0 ? 'reset' : 'upload'} size={15} />
                {uploadingResume ? 'Uploading…' : resumes.length > 0 ? 'Replace CV' : 'Upload CV'}
              </button>
              {uploadMsg && <div style={{ marginTop: 8, fontSize: 12, color: uploadMsg.includes('failed') ? '#DC2626' : '#059669', fontWeight: 600 }}>{uploadMsg}</div>}
              <input
                id="resume-upload-sidebar"
                type="file"
                accept=".pdf,.docx"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setUploadingResume(true);
                  setUploadMsg('');
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const token = localStorage.getItem('tf_user_token');
                    const base = import.meta.env.VITE_API_URL || 'http://localhost:8001';
                    const res = await fetch(`${base}/applicant/resume/upload`, {
                      method: 'POST',
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                      body: formData,
                    });
                    if (!res.ok) throw new Error('Upload failed');
                    const data = await res.json();
                    setUploadMsg('CV uploaded successfully!');
                    if (data.extracted_profile) setExtractionPreview({ resumeId: data.id, profile: data.extracted_profile });
                    resumeApi.list().then(list => setResumes(Array.isArray(list) ? list : [])).catch(() => null);
                    // Refresh profile completion
                    profileApi.get().then(p => {
                      setApiProfile(p);
                      updateUser({ profileCompletion: p.profile_completion });
                    }).catch(() => null);
                  } catch {
                    setUploadMsg('Upload failed. Please try again.');
                  } finally {
                    setUploadingResume(false);
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {/* Availability */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Availability</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Immediate', '2 Weeks', '1 Month'].map(a => {
                  const selected = (user?.availability || form.availability) === a;
                  return (
                    <button
                      key={a}
                      className={`chip ${selected ? 'selected' : ''}`}
                      style={{ padding: '7px 14px' }}
                      onClick={() => { setForm(f => ({ ...f, availability: a })); updateUser({ availability: a }); }}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {expModal && (
        <ExperienceModal
          mode={expModal.mode}
          initial={expModal.data}
          onClose={() => setExpModal(null)}
          onSave={saveExperience}
        />
      )}
      {eduModal && (
        <EducationModal
          mode={eduModal.mode}
          initial={eduModal.data}
          onClose={() => setEduModal(null)}
          onSave={saveEducation}
        />
      )}
      {extractionPreview && (
        <ExtractionPreviewModal
          resumeId={extractionPreview.resumeId}
          profile={extractionPreview.profile}
          onClose={() => setExtractionPreview(null)}
          onApply={async () => {
            try {
              console.log('[Profile] Applying parsed resume data', extractionPreview.profile);
              const result = await resumeApi.applyExtraction(extractionPreview.resumeId, extractionPreview.profile);
              console.log('[Profile] Resume apply request success', result);
              const updated = await profileApi.get();
              console.log('[Profile] Profile refresh success', updated);
              setApiProfile(updated);
              setForm(f => ({
                ...f,
                name:         updated.name         || f.name,
                headline:     updated.headline     || f.headline,
                bio:          updated.bio          || f.bio,
                phone:        updated.phone        || f.phone,
                location:     updated.location     || f.location,
                linkedin:     updated.linkedin     || f.linkedin,
                portfolio:    updated.portfolio    || f.portfolio,
                skills:       updated.skills?.length    ? updated.skills    : f.skills,
                languages:    updated.languages?.length ? updated.languages : f.languages,
                availability: updated.availability || f.availability,
              }));
              updateUser({
                profileCompletion: updated.profile_completion,
                profile_completion: updated.profile_completion,
                skills: updated.skills || [],
                languages: updated.languages || [],
                experiences: updated.experiences || [],
                education: updated.education || [],
                certifications: updated.certifications || [],
                projects: updated.projects || [],
              });
              setUploadMsg(result?.message || 'Resume information successfully added to your profile.');
              setExtractionPreview(null);
            } catch (err) {
              console.error('[Profile] Failed to apply parsed resume data', err);
              setUploadMsg(err?.message || 'Could not save resume information to your profile.');
              throw err;
            }
          }}
        />
      )}
    </AppLayout>
  );
}

function ExperienceModal({ mode, initial, onClose, onSave }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState('');
  const valid = data.title.trim() && data.company.trim();

  const submit = () => {
    if (!valid) { setError('Job title and company are required.'); return; }
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{mode === 'add' ? 'Add Work Experience' : 'Edit Work Experience'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Job Title</label><input className="form-input" value={data.title} onChange={e => setData(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Frontend Engineer" /></div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Company</label><input className="form-input" value={data.company} onChange={e => setData(d => ({ ...d, company: e.target.value }))} placeholder="e.g. STC" /></div>
            <div className="form-group"><label className="form-label">Start Year</label><input className="form-input" value={data.startYear} onChange={e => setData(d => ({ ...d, startYear: e.target.value }))} placeholder="2022" /></div>
            <div className="form-group"><label className="form-label">End Year</label><input className="form-input" value={data.endYear} onChange={e => setData(d => ({ ...d, endYear: e.target.value }))} placeholder="Present" /></div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Description</label><textarea className="form-input form-textarea" value={data.description} onChange={e => setData(d => ({ ...d, description: e.target.value }))} placeholder="Describe your responsibilities and achievements..." style={{ minHeight: 100 }} /></div>
          </div>
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#DC2626', fontSize: 13, fontWeight: 500 }}><Icon name="alert" size={15} /> {error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!valid}>{mode === 'add' ? 'Add Experience' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

function EducationModal({ mode, initial, onClose, onSave }) {
  const [data, setData] = useState({ gpaScale: '4.0', ...initial });
  const [error, setError] = useState('');
  const scaleMax = parseFloat(data.gpaScale || '4.0');
  const gpaNum = data.gpa === '' || data.gpa == null ? null : parseFloat(data.gpa);
  const gpaInvalid = gpaNum != null && (isNaN(gpaNum) || gpaNum < 0 || gpaNum > scaleMax);
  const valid = data.degree.trim() && data.university.trim() && !gpaInvalid;

  const submit = () => {
    if (!data.degree.trim() || !data.university.trim()) { setError('Degree and institution are required.'); return; }
    if (gpaInvalid) { setError(`GPA must be a number between 0 and ${data.gpaScale}.`); return; }
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{mode === 'add' ? 'Add Education' : 'Edit Education'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group"><label className="form-label">Degree / Qualification</label><input className="form-input" value={data.degree} onChange={e => setData(d => ({ ...d, degree: e.target.value }))} placeholder="e.g. Bachelor of Science in Computer Science" /></div>
            <div className="form-group"><label className="form-label">University / Institution</label><input className="form-input" value={data.university} onChange={e => setData(d => ({ ...d, university: e.target.value }))} placeholder="e.g. King Saud University" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Graduation Year</label>
                <select className="form-input form-select" value={data.graduationYear} onChange={e => setData(d => ({ ...d, graduationYear: e.target.value }))}>
                  <option value="">Select year</option>
                  {Array.from({ length: 35 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">GPA <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" type="number" step="0.01" min="0" max={data.gpaScale} value={data.gpa ?? ''} onChange={e => setData(d => ({ ...d, gpa: e.target.value }))} placeholder="e.g. 4.65" />
              </div>
              <div className="form-group">
                <label className="form-label">GPA Scale</label>
                <select className="form-input form-select" value={data.gpaScale || '4.0'} onChange={e => setData(d => ({ ...d, gpaScale: e.target.value }))}>
                  <option value="4.0">Out of 4.0</option>
                  <option value="5.0">Out of 5.0</option>
                </select>
              </div>
            </div>
          </div>
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#DC2626', fontSize: 13, fontWeight: 500 }}><Icon name="alert" size={15} /> {error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!valid}>{mode === 'add' ? 'Add Education' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

function ExtractionPreviewModal({ resumeId, profile, onClose, onApply }) {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const p = profile || {};

  const handleApply = async () => {
    setError('');
    setApplying(true);
    try {
      await onApply();
    } catch (err) {
      setError(err?.message || 'Could not apply resume information.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>CV Extracted — Review & Apply</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>AI extracted the following data from your resume. Review and apply to your profile.</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {p.name        && <PreviewRow label="Name"          value={p.name} />}
          {p.email       && <PreviewRow label="Email"         value={p.email} />}
          {p.phone       && <PreviewRow label="Phone"         value={p.phone} />}
          {p.location    && <PreviewRow label="Location"      value={p.location} />}
          {p.headline    && <PreviewRow label="Headline"      value={p.headline} />}
          {p.linkedin    && <PreviewRow label="LinkedIn"      value={p.linkedin} />}
          {p.skills?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Skills ({p.skills.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.skills.map(s => <span key={s} style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid #C7D2FE' }}>{s}</span>)}
              </div>
            </div>
          )}
          {p.education?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Education</div>
              {p.education.map((e, i) => <div key={i} style={{ fontSize: 14, color: 'var(--text-primary)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>{e.degree} — {e.university} {e.graduation_year && `(${e.graduation_year})`}</div>)}
            </div>
          )}
          {p.experience?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Experience</div>
              {p.experience.map((e, i) => <div key={i} style={{ fontSize: 14, color: 'var(--text-primary)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>{e.title} at {e.company} {e.start_year && `(${e.start_year}–${e.end_year || 'Present'})`}</div>)}
            </div>
          )}
          {p.languages?.length > 0 && <PreviewList title={`Languages (${p.languages.length})`} items={p.languages} />}
          {p.certifications?.length > 0 && <PreviewList title="Certifications" items={p.certifications.map(c => c.name || c)} />}
          {p.projects?.length > 0 && <PreviewList title="Projects" items={p.projects.map(project => project.name || project)} />}
          {error && <div style={{ padding: 12, borderRadius: 10, background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 700 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Review Later</button>
          <button className="btn btn-primary" onClick={handleApply} disabled={applying}>
            {applying ? 'Applying…' : 'Apply to Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 90, flexShrink: 0, paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>{value}</div>
    </div>
  );
}

function PreviewList({ title, items }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(items || []).filter(Boolean).map((item) => (
          <span key={String(item)} style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>{item}</span>
        ))}
      </div>
    </div>
  );
}
