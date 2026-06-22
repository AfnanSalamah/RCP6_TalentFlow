import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { applicationsApi } from '../../api/index';
import Icon from '../components/common/Icon';

const statusStyles = {
  'Applied': { bg: '#EEF7FC', color: '#49769F' },
  'Resume Reviewed': { bg: '#F0F7FB', color: '#49769F' },
  'Shortlisted': { bg: '#EAF7FA', color: '#4E8EA2' },
  'Interview Scheduled': { bg: '#EDF6FB', color: '#49769F' },
  'Interviewed': { bg: '#EFF6FF', color: '#2563EB' },
  'Hired': { bg: '#D1FAE5', color: '#065F46' },
  'Rejected': { bg: '#FEF2F2', color: '#DC2626' },
  'Withdrawn': { bg: '#EEF7FC', color: '#64748B' },
};

// Trigger a client-side file download from a string (no backend needed).
function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
//  APPLICATION PROGRESS STEPPER
//  Redesigned from scratch: unique SVG icon per step, gradient-filled nodes,
//  glow ring on the current step, smooth connecting progress bar.
// ─────────────────────────────────────────────────────────────────────────────

const STEPPER_STEPS = [
  {
    label: 'Applied',
    sub:   'Application sent',
    icon:  (c) => (
      // FileText — document with lines
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
           stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="8" y1="13" x2="16" y2="13"/>
        <line x1="8" y1="17" x2="16" y2="17"/>
        <line x1="8" y1="9"  x2="11" y2="9"/>
      </svg>
    ),
  },
  {
    label: 'Reviewed',
    sub:   'Resume reviewed',
    icon:  (c) => (
      // Search — magnifying glass
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
           stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    label: 'Shortlisted',
    sub:   'Candidate selected',
    icon:  (c) => (
      // Star — selection / top pick
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
           stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    label: 'Interview',
    sub:   'Interview scheduled',
    icon:  (c) => (
      // Calendar — scheduled meeting
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
           stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2"  x2="16" y2="6"/>
        <line x1="8"  y1="2"  x2="8"  y2="6"/>
        <line x1="3"  y1="10" x2="21" y2="10"/>
        <line x1="8"  y1="14" x2="8"  y2="14" strokeWidth="3"/>
        <line x1="12" y1="14" x2="12" y2="14" strokeWidth="3"/>
        <line x1="16" y1="14" x2="16" y2="14" strokeWidth="3"/>
      </svg>
    ),
  },
  {
    label: 'Offer',
    sub:   'Offer extended',
    icon:  (c) => (
      // Gift — offer / reward
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
           stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"/>
        <rect x="2" y="7" width="20" height="5"/>
        <line x1="12" y1="22" x2="12" y2="7"/>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
    ),
  },
  {
    label: 'Signed',
    sub:   'Offer or contract signed',
    icon:  (c) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
           stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5"/>
        <path d="M16 3h5v5"/>
      </svg>
    ),
  },
];

// Primary brand palette
const S_ACCENT      = '#0A4174';
const S_ACCENT2     = '#4E8EA2';
const S_DONE_BG     = `linear-gradient(135deg, ${S_ACCENT} 0%, ${S_ACCENT2} 100%)`;
const S_TRACK_ON    = S_ACCENT;
const S_TRACK_OFF   = '#E8EEF4';
const S_NODE_OFF_BG = '#F4F7FA';
const S_NODE_OFF_BD = '#DDE4EE';
const S_ICON_OFF    = '#A8B8CC';

function ApplicationStepper({ activeIndex }) {
  // Cap: timeline can have 6 entries but stepper only has 5 slots
  const stepIdx = activeIndex < 0 ? -1 : Math.min(activeIndex, STEPPER_STEPS.length - 1);
  // NODE_SIZE must match `top` in the connector below (top = NODE_SIZE/2 - 1)
  const NODE = 44;

  return (
    <div style={{
      marginTop: 24,
      paddingTop: 20,
      borderTop: '1px solid #EEF2F8',
    }}>
      {/* Section label */}
      <div style={{
        fontSize: 10,
        fontWeight: 800,
        color: '#9BAAB8',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: 22,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        Application Progress
      </div>

      {/* Steps row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
        {STEPPER_STEPS.map((step, i) => {
          const isDone    = stepIdx > i;
          const isCurrent = stepIdx === i;
          const isActive  = isDone || isCurrent;

          return (
            <div
              key={step.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* ── Connecting progress bar ──────────────────────────────── */}
              {i > 0 && (
                <div style={{
                  position: 'absolute',
                  left: '-50%',
                  width: '100%',
                  top: NODE / 2 - 1.5,     // vertically centred on the node
                  height: 3,
                  borderRadius: 99,
                  background: isActive ? S_TRACK_ON : S_TRACK_OFF,
                  transition: 'background 0.45s ease',
                  zIndex: 0,
                }} />
              )}

              {/* ── Step node ────────────────────────────────────────────── */}
              <div style={{
                width:  NODE,
                height: NODE,
                borderRadius: '50%',
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.35s ease',

                // Background
                background: isDone
                  ? S_DONE_BG
                  : isCurrent
                    ? S_ACCENT
                    : S_NODE_OFF_BG,

                // Border
                border: `2px solid ${isActive ? 'transparent' : S_NODE_OFF_BD}`,

                // Shadow / glow
                boxShadow: isCurrent
                  ? `0 0 0 5px rgba(10,65,116,0.11), 0 6px 18px rgba(10,65,116,0.22)`
                  : isDone
                    ? '0 3px 10px rgba(10,65,116,0.18)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                {isDone ? (
                  /* Checkmark for completed steps */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  /* Unique icon for current / pending steps */
                  step.icon(isActive ? '#fff' : S_ICON_OFF)
                )}
              </div>

              {/* ── Current-step pulse ring (extra visual cue) ───────────── */}
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: NODE + 16,
                  height: NODE + 16,
                  borderRadius: '50%',
                  border: '2px solid rgba(10,65,116,0.18)',
                  zIndex: 0,
                  pointerEvents: 'none',
                  marginTop: -(NODE / 2 + 8) + NODE / 2,   // keep centred on node
                }} />
              )}

              {/* ── Text labels ──────────────────────────────────────────── */}
              <div style={{ textAlign: 'center', marginTop: 11, paddingTop: 0 }}>
                <div style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  lineHeight: 1.3,
                  color: isCurrent
                    ? S_ACCENT
                    : isDone
                      ? '#1E2D3E'
                      : '#9BAAB8',
                  transition: 'color 0.3s ease',
                }}>
                  {step.label}
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#B0BEC8',
                  marginTop: 3,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  whiteSpace: 'nowrap',
                }}>
                  {step.sub}
                </div>
                {/* "In Progress" badge under current step */}
                {isCurrent && (
                  <div style={{
                    marginTop: 6,
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    background: 'rgba(10,65,116,0.08)',
                    color: S_ACCENT,
                    border: '1px solid rgba(10,65,116,0.14)',
                  }}>
                    In Progress
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  APPLICATION TIMELINE  (Horizontal stepper — 6 steps with dates & descriptions)
// ─────────────────────────────────────────────────────────────────────────────

const TL_ACCENT  = '#0A4174';
const TL_ACCENT2 = '#4E8EA2';

// Unique icon per step (white on coloured nodes, muted on pending)
const TL_ICONS = [
  // 1 Applied – paper plane / send
  (c) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  // 2 Resume Reviewed – search / magnifier
  (c) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  // 3 Shortlisted – star
  (c) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  // 4 Interview Scheduled – calendar
  (c) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  ),
  // 5 Interviewed – chat / people
  (c) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  // 6 Decision – checkmark shield
  (c) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
];

function ApplicationTimeline({ timeline }) {
  const NODE = 38; // node diameter (px)
  const HALF = NODE / 2;

  return (
    <div className="card" style={{ padding: 28 }}>

      {/* ── Card header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 34 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${TL_ACCENT} 0%, ${TL_ACCENT2} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(10,65,116,0.22)',
        }}>
          {/* Timeline / list icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6"  x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6"  x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </div>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: '#1E293B', margin: 0, lineHeight: 1 }}>
            Application Timeline
          </h3>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0', fontWeight: 500 }}>
            Track every stage of your application
          </p>
        </div>
      </div>

      {/* ── Horizontal stepper ── */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          position: 'relative',
          minWidth: 540, // prevents extreme squishing on narrow screens
        }}>
          {timeline.map((item, i) => {
            const isCompleted = item.done && !item.current;
            const isCurrent   = !!item.current;
            const isPending   = !item.done && !item.current;
            // Connector for step i leads FROM step i-1 → i; colour = step i status
            const connDone    = item.done || item.current;

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                {/* ── Connector bar ── */}
                {i > 0 && (
                  <div style={{
                    position: 'absolute',
                    left: '-50%',
                    width: '100%',
                    top: HALF - 1.5,
                    height: 3,
                    borderRadius: 99,
                    zIndex: 0,
                    background: connDone
                      ? `linear-gradient(90deg, ${TL_ACCENT} 0%, ${TL_ACCENT2} 100%)`
                      : 'repeating-linear-gradient(90deg, #CBD5E1 0, #CBD5E1 5px, transparent 5px, transparent 10px)',
                  }} />
                )}

                {/* ── Node ── */}
                <div style={{
                  position: 'relative',
                  zIndex: 1,
                  width: NODE,
                  height: NODE,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCompleted
                    ? `linear-gradient(135deg, ${TL_ACCENT} 0%, ${TL_ACCENT2} 100%)`
                    : isCurrent
                      ? TL_ACCENT
                      : '#F1F5F9',
                  border: isPending
                    ? '2px solid #CBD5E1'
                    : '2px solid transparent',
                  boxShadow: isCurrent
                    ? `0 0 0 5px rgba(10,65,116,0.13), 0 4px 14px rgba(10,65,116,0.25)`
                    : isCompleted
                      ? '0 2px 8px rgba(10,65,116,0.2)'
                      : '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.3s',
                }}>
                  {isPending ? (
                    // Pending: show step number muted
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8' }}>{i + 1}</span>
                  ) : (
                    // Done or Current: icon in white
                    TL_ICONS[i] ? TL_ICONS[i]('#fff') : (
                      // Fallback checkmark
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )
                  )}
                </div>

                {/* Animated pulse ring for current step */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: NODE + 14,
                    height: NODE + 14,
                    borderRadius: '50%',
                    border: `2px solid rgba(10,65,116,0.2)`,
                    zIndex: 0,
                    pointerEvents: 'none',
                  }} />
                )}

                {/* ── Content below node ── */}
                <div style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '0 6px',
                  textAlign: 'center',
                }}>
                  {/* Step title */}
                  <div style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: isCurrent
                      ? TL_ACCENT
                      : isCompleted
                        ? '#1E293B'
                        : '#94A3B8',
                    marginBottom: isCurrent ? 5 : 4,
                  }}>
                    {item.status}
                  </div>

                  {/* "Current" badge */}
                  {isCurrent && (
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 7px',
                      borderRadius: 99,
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      background: 'rgba(10,65,116,0.08)',
                      color: TL_ACCENT,
                      border: '1px solid rgba(10,65,116,0.16)',
                      marginBottom: 5,
                    }}>
                      Current
                    </div>
                  )}

                  {/* Date + time */}
                  {item.date ? (
                    <div style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: isCurrent ? '#4E6C8A' : isCompleted ? '#64748B' : '#CBD5E1',
                      lineHeight: 1.5,
                      marginBottom: 6,
                    }}>
                      {item.date}
                      <br />
                      <span style={{ fontSize: 9.5 }}>{item.time}</span>
                    </div>
                  ) : (
                    // Placeholder so columns stay vertically consistent
                    <div style={{ height: 32, marginBottom: 6 }} />
                  )}

                  {/* Description */}
                  {item.description && (
                    <div style={{
                      fontSize: 10.5,
                      lineHeight: 1.6,
                      color: isCurrent
                        ? '#4A6580'
                        : isCompleted
                          ? '#64748B'
                          : '#CBD5E1',
                      fontWeight: 400,
                    }}>
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [reminderSet, setReminderSet] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [companyMessage, setCompanyMessage] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [companyThread, setCompanyThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    applicationsApi.get(id)
      .then((d) => { if (alive) { setData(d); setStatus(d.status); } })
      .catch((e) => { if (alive) setError(e.message || 'Failed to load application.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="page-wrapper" style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
          Loading application…
        </div>
      </AppLayout>
    );
  }
  if (error || !data) {
    return (
      <AppLayout>
        <div className="page-wrapper" style={{ padding: 40 }}>
          <p style={{ color: '#DC2626', marginBottom: 12 }}>{error || 'Application not found.'}</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/user/applications')}>
            <Icon name="chevronLeft" size={16} /> Back to Applications
          </button>
        </div>
      </AppLayout>
    );
  }

  // ── View model built entirely from the live API response ──
  const rawTimeline = (data.timeline || []).map((t, i, arr) => ({
    status: t.status, date: t.date, time: t.time, description: t.description,
    done: true, current: i === arr.length - 1,
  }));
  const iv = (data.interviews || [])[0];
  const app = {
    jobId: data.jobId,
    jobTitle: data.jobTitle || 'Application',
    company: data.company || 'Company',
    location: data.location || '',
    appliedDate: data.appliedDate || '',
    type: data.type || '',
    status: data.status,
    notes: data.notes || '',
    timeline: rawTimeline,
    feedback: data.feedback || [],
    interview: iv ? { date: iv.date, time: iv.time, type: iv.type, location: iv.location || 'TBA', interviewers: [] } : null,
    recruiter: { name: `${data.company || 'Company'} Hiring Team`, email: '', title: 'Recruiter' },
  };
  const cleanLocation = (app.location || '').replace(', Saudi Arabia', '');
  const ss = statusStyles[status] || { bg: '#EEF7FC', color: '#49769F' };

  const addToCalendar = () => {
    if (!app.interview) return;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TalentFlow//EN', 'BEGIN:VEVENT',
      `SUMMARY:Interview — ${app.jobTitle} at ${app.company}`,
      `LOCATION:${app.interview.location}`,
      `DESCRIPTION:${app.interview.type} for ${app.jobTitle} at ${app.company}.`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    downloadFile(`interview-${app.company}.ics`, ics, 'text/calendar');
  };

  const viewLocation = () => {
    if (!app.interview) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(app.interview.location)}`, '_blank', 'noopener');
  };

  const messageRecruiter = async () => {
    setMessageStatus('');
    setCompanyMessage(`Hello ${app.recruiter.name},\n\nI would like to follow up on my application for ${app.jobTitle}.`);
    setMessageOpen(true);
    setThreadLoading(true);
    try {
      const thread = await applicationsApi.companyConversation(id);
      setCompanyThread(thread);
    } catch {
      setCompanyThread(null);
    } finally {
      setThreadLoading(false);
    }
  };

  const sendCompanyMessage = async () => {
    if (!companyMessage.trim()) {
      setMessageStatus('Please write a message first.');
      return;
    }
    setMessageStatus('Sending...');
    try {
      const thread = await applicationsApi.messageCompany(id, {
        subject: `Re: ${app.jobTitle} application`,
        message: companyMessage,
      });
      setCompanyThread(thread);
      setMessageStatus('Message sent to the hiring team.');
      setCompanyMessage('');
    } catch (e) {
      setMessageStatus(e.message || 'Could not send message.');
    }
  };

  const downloadApplication = () => {
    const summary =
`TalentFlow — Application Summary
================================
Position:   ${app.jobTitle}
Company:    ${app.company}
Location:   ${cleanLocation}
Applied:    ${app.appliedDate}
Status:     ${status}
Recruiter:  ${app.recruiter.name} (${app.recruiter.email})

Timeline:
${app.timeline.map(t => `- ${t.status}${t.date ? ` (${t.date})` : ''}`).join('\n')}
`;
    downloadFile(`application-${app.company}.txt`, summary);
  };

  const withdraw = async () => {
    try {
      await applicationsApi.withdraw(id);
      setShowWithdraw(false);
      navigate('/user/applications');
    } catch (e) {
      setError(e.message || 'Could not withdraw the application.');
      setShowWithdraw(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-wrapper">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => navigate('/user/applications')}><Icon name="chevronLeft" size={16} /> Applications</button>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{app.jobTitle} · {app.company}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }} className="details-grid">
          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ width: 60, height: 60, borderRadius: 14, background: `linear-gradient(135deg, hsl(${app.company.charCodeAt(0) * 5 % 360}, 55%, 50%), hsl(${app.company.charCodeAt(0) * 7 % 360}, 60%, 42%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 24, flexShrink: 0 }}>
                  {app.company[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{app.jobTitle}</h1>
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: ss.bg, color: ss.color }}>{status}</span>
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>{app.company} · {cleanLocation}</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="calendar" size={14} /> Applied {app.appliedDate}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="briefcase" size={14} /> {app.type}</span>
                  </div>
                </div>
              </div>

              {/* ── Application Progress Stepper (redesigned) ── */}
              <ApplicationStepper
                activeIndex={statusToStepIndex(status)}
              />
            </div>

            {/* Interview info */}
            {app.interview && (
              <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #EDF6FB, #E0F2FE)', border: '1px solid #BAE6FD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: 'var(--info)' }}>
                      <Icon name="calendar" size={18} />
                      <h3 style={{ fontWeight: 800, fontSize: 16 }}>Interview Scheduled</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {[
                        { label: 'Date', value: app.interview.date, icon: 'calendar' },
                        { label: 'Time', value: app.interview.time, icon: 'clock' },
                        { label: 'Format', value: app.interview.type, icon: 'building' },
                        { label: 'Location', value: app.interview.location, icon: 'location' },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ fontSize: 11, color: 'var(--info)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}><Icon name={item.icon} size={12} /> {item.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Interviewers:</div>
                      {app.interview.interviewers.map((iv, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                            {iv[0]}
                          </div>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{iv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={addToCalendar}><Icon name="calendarPlus" size={15} /> Add to Calendar</button>
                    <button className="btn btn-outline btn-sm" onClick={viewLocation}><Icon name="location" size={15} /> View Location</button>
                  </div>
                </div>
                {app.notes && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, border: '1px solid #BAE6FD' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--info)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="file" size={13} /> Preparation Notes</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{app.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── Horizontal Application Timeline ───────────────────────── */}
            <ApplicationTimeline timeline={app.timeline} />

            {app.feedback.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0A4174,#4E8EA2)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                    <Icon name="message" size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>Interview Feedback</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Shared by the hiring team</p>
                  </div>
                </div>
                {app.feedback.map((fb, idx) => (
                  <div key={idx} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-2)', marginTop: idx ? 10 : 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {fb.rating && <span style={{ padding: '4px 10px', borderRadius: 99, background: '#EAF6FC', color: '#0A4174', fontSize: 12, fontWeight: 800 }}>Rating {fb.rating}/5</span>}
                      {fb.recommendation && <span style={{ padding: '4px 10px', borderRadius: 99, background: '#ECFDF3', color: '#047857', fontSize: 12, fontWeight: 800 }}>{fb.recommendation}</span>}
                    </div>
                    {fb.feedback && <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{fb.feedback}</p>}
                    {fb.notes && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{fb.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
            {/* Recruiter */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Your Recruiter</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>
                  {app.recruiter.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{app.recruiter.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.recruiter.title}</div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={messageRecruiter}>
                <Icon name="message" size={15} /> Send Message
              </button>
            </div>

            {/* Quick info */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Application Summary</h3>
              {[
                { label: 'Position', value: app.jobTitle },
                { label: 'Company', value: app.company },
                { label: 'Location', value: cleanLocation },
                { label: 'Applied', value: app.appliedDate },
                { label: 'Status', value: status },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => navigate(`/user/jobs/${app.jobId}`)}><Icon name="eye" size={15} /> View Job Listing</button>
                <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={downloadApplication}><Icon name="download" size={15} /> Download Application</button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', color: reminderSet ? 'var(--success)' : undefined }}
                  onClick={() => setReminderSet(true)}
                  disabled={reminderSet}
                >
                  <Icon name={reminderSet ? 'checkCircle' : 'bell'} size={15} /> {reminderSet ? 'Reminder Set' : 'Set Reminder'}
                </button>
                {status !== 'Rejected' && status !== 'Withdrawn' && (
                  <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', color: 'var(--error)', border: '1px solid var(--border)', marginTop: 4 }} onClick={() => setShowWithdraw(true)}><Icon name="close" size={15} /> Withdraw Application</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWithdraw && (
        <div className="modal-overlay" onClick={() => setShowWithdraw(false)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="alert" size={20} /> Withdraw Application</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowWithdraw(false)}><Icon name="close" size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Are you sure you want to withdraw your application for <strong>{app.jobTitle}</strong> at <strong>{app.company}</strong>? This will notify the recruiter and cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowWithdraw(false)}>Keep Application</button>
              <button className="btn" style={{ background: '#DC2626', color: '#fff' }} onClick={withdraw}>Withdraw</button>
            </div>
          </div>
        </div>
      )}

      {messageOpen && (
        <div className="modal-overlay" onClick={() => setMessageOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="message" size={20} /> Message Hiring Team</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setMessageOpen(false)}><Icon name="close" size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>This message will be sent to {app.company}'s hiring team.</p>
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-2)', padding: 12, maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
                {threadLoading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Loading conversation...</div>
                ) : companyThread?.messages?.length ? (
                  companyThread.messages.map((m) => {
                    const mine = m.senderType === 'user';
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                        <div style={{ maxWidth: '78%', borderRadius: 12, padding: '9px 11px', background: mine ? 'linear-gradient(135deg,#0A4174,#4E8EA2)' : '#fff', color: mine ? '#fff' : 'var(--text-primary)', border: mine ? 'none' : '1px solid var(--border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.8, marginBottom: 3 }}>{mine ? 'You' : m.senderName || 'Hiring Team'}</div>
                          <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.message}</div>
                          <div style={{ fontSize: 10, opacity: 0.65, marginTop: 5 }}>{m.createdAt}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 18 }}>No messages yet. Start the conversation below.</div>
                )}
              </div>
              <textarea
                className="form-input"
                rows={7}
                value={companyMessage}
                onChange={e => setCompanyMessage(e.target.value)}
                style={{ width: '100%', resize: 'vertical', minHeight: 150 }}
              />
              {messageStatus && (
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: messageStatus.includes('sent') ? 'var(--success)' : messageStatus === 'Sending...' ? 'var(--primary)' : 'var(--error)' }}>
                  {messageStatus}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setMessageOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendCompanyMessage}><Icon name="message" size={15} /> Send Message</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function statusToStepIndex(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('contract') || s.includes('signed') || s.includes('hired')) return 5;
  if (s.includes('offer')) return 4;
  if (s.includes('interview')) return 3;
  if (s.includes('shortlist')) return 2;
  if (s.includes('review')) return 1;
  return 0;
}
