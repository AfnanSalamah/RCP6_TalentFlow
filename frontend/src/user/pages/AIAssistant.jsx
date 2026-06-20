import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { aiResponses } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/common/Icon';
import { aiApi } from '../../api/index';

const quickPrompts = [
  { label: 'CV Tips', key: 'resume', text: 'Can you review my CV and suggest improvements?' },
  { label: 'Job Matches', key: 'jobs', text: 'What roles match my profile in the Saudi market?' },
  { label: 'Skill Gaps', key: 'skills', text: 'What skills should I learn to advance my career?' },
  { label: 'Career Path', key: 'career', text: 'What career paths should I consider given my background?' },
];

function Message({ msg, userInitials }) {
  const isUser = msg.role === 'user';
  const text = msg.text || aiResponses[msg.key] || '';

  const formatted = text.split('\n').map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <div key={i} dangerouslySetInnerHTML={{ __html: bold }} style={{ marginBottom: line.trim() === '' ? 4 : 2 }} />;
  });

  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', justifyContent: isUser ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.3s ease' }}>
      {!isUser && (
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, marginTop: 4 }}><Icon name="sparkles" size={18} /></div>
      )}
      <div style={{ maxWidth: '72%' }}>
        <div style={{
          padding: '12px 16px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'linear-gradient(135deg, #0A4174, #4E8EA2)' : '#fff',
          color: isUser ? '#fff' : 'var(--text-primary)',
          border: isUser ? 'none' : '1px solid var(--border)',
          boxShadow: isUser ? '0 4px 12px rgba(79,70,229,0.25)' : 'var(--shadow-sm)',
          fontSize: 14, lineHeight: 1.7,
        }}>
          {formatted}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>{msg.ts}</div>
      </div>
      {isUser && (
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7BBDE8, #F472B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 800, flexShrink: 0, marginTop: 4 }}>
          {userInitials}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><Icon name="sparkles" size={18} /></div>
      <div style={{ padding: '14px 18px', background: '#fff', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 0.15, 0.3].map((delay, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: `pulse 1.2s ease-in-out ${delay}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const { user } = useAuth();
  const displayName = user?.name || user?.email?.split('@')[0] || '';
  const userInitials = displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello ${displayName || 'there'}, I can help review your CV, suggest job matches, identify skill gaps, and plan your next career step.`,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [activeCapability, setActiveCapability] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length || prev[0].role !== 'assistant') return prev;
      return [
        {
          ...prev[0],
          text: `Hello ${displayName || 'there'}, I can help review your CV, suggest job matches, identify skill gaps, and plan your next career step.`,
        },
        ...prev.slice(1),
      ];
    });
  }, [displayName]);

  const sendMessage = async (text, key = null) => {
    if (!text.trim()) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(m => [...m, { role: 'user', text, ts }]);
    setInput('');
    setTyping(true);

    const ts2 = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      let responseText = '';
      const lc = text.toLowerCase();
      if (key === 'resume' || lc.includes('cv') || lc.includes('resume')) {
        const data = await aiApi.reviewResume();
        responseText = `${displayName ? `${displayName}, ` : ''}**Resume Score: ${data.resume_score}/100** | ATS Score: ${data.ats_score}/100\n\n${data.summary}\n\n**Strengths:**\n${data.strengths.map(s => `• ${s}`).join('\n')}\n\n**Areas to Improve:**\n${data.weaknesses.map(w => `• ${w}`).join('\n')}\n\n**Suggestions:**\n${data.improvements.map(i => `• ${i}`).join('\n')}`;
      } else if (key === 'jobs' || lc.includes('job') || lc.includes('match') || lc.includes('role')) {
        const data = await aiApi.jobMatching({});
        responseText = `**Top Job Matches for ${displayName || 'Your Profile'}:**\n\n${data.slice(0, 3).map(j => `**${j.job_title}** at ${j.company}\nMatch: ${j.match_score}% — ${j.recommendation}\nMatching skills: ${j.matching_skills.join(', ') || 'N/A'}`).join('\n\n')}`;
      } else if (key === 'career' || lc.includes('career') || lc.includes('path')) {
        const data = await aiApi.careerRecommendations();
        responseText = `${displayName ? `${displayName}, ` : ''}**Career Stage: ${data.career_stage}**\n\n${data.suggestions.map(s => `• ${s}`).join('\n')}\n\n**Recommended skills to learn:** ${data.recommended_skills.join(', ') || 'Keep growing!'}\n\n**Estimated salary range:** ${data.estimated_salary_range}`;
      } else {
        // Fallback to mock
        const mockKey = lc.includes('skill') ? 'skills' : 'jobs';
        setTyping(false);
        setMessages(m => [...m, { role: 'assistant', key: mockKey, ts: ts2 }]);
        return;
      }
      setTyping(false);
      setMessages(m => [...m, { role: 'assistant', text: responseText, ts: ts2 }]);
    } catch {
      // Fall back to mock responses
      const fallbackKey = key || (text.toLowerCase().includes('cv') || text.toLowerCase().includes('resume') ? 'resume' : text.toLowerCase().includes('skill') ? 'skills' : text.toLowerCase().includes('career') ? 'career' : 'jobs');
      setTyping(false);
      setMessages(m => [...m, { role: 'assistant', key: fallbackKey, ts: ts2 }]);
    }
  };

  const capabilities = [
    { icon: 'file', label: 'CV Review', desc: 'Personalized feedback on your CV', color: '#0A4174', bg: '#EAF5FB' },
    { icon: 'target', label: 'Job Matching', desc: 'Roles that fit your skills', color: '#4E8EA2', bg: '#EAF7FA' },
    { icon: 'zap', label: 'Skill Advisor', desc: 'Skills in demand locally', color: '#49769F', bg: '#EDF6FB' },
    { icon: 'trending', label: 'Career Coach', desc: 'Guidance on growth', color: '#4E8EA2', bg: '#EAF7FA' },
  ];

  return (
    <AppLayout title="Career Assistant" subtitle="Guidance tailored to the Saudi job market">
      <div className="page-wrapper ai-grid" style={{ display: 'flex', gap: 24, height: 'calc(100vh - 140px)', minHeight: 600 }}>

        {/* Sidebar */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }} className="ai-sidebar">
          {/* AI badge */}
          <div style={{ background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', borderRadius: 16, padding: '20px', color: '#fff', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Icon name="sparkles" size={36} /></div>
            <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Career Assistant</h3>
            <p style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>Your guide to careers in the Kingdom</p>
          </div>

          {/* Capabilities */}
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Capabilities</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {capabilities.map((cap, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveCapability(i); sendMessage(quickPrompts[i].text, quickPrompts[i].key); }}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10,
                    border: `1.5px solid ${activeCapability === i ? cap.color : 'var(--border)'}`,
                    background: activeCapability === i ? cap.bg : '#fff',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cap.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cap.color }}><Icon name={cap.icon} size={16} /></div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: activeCapability === i ? cap.color : 'var(--text-primary)' }}>{cap.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 1 }}>{cap.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Your Insights</h4>
            {[
              { label: 'Profile Score', value: '85/100', icon: 'badge', color: 'var(--primary)' },
              { label: 'Skills Tracked', value: `${user?.skills?.length || 8}`, icon: 'zap', color: 'var(--success)' },
              { label: 'Active Applications', value: '3', icon: 'clipboard', color: 'var(--warning)' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: item.color }}><Icon name={item.icon} size={16} /></span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="sparkles" size={20} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>TalentFlow Career Assistant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                Online · Responds instantly
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto', fontSize: 13, gap: 5 }}
              onClick={() => { setMessages(initialMessages); setActiveCapability(null); }}
            ><Icon name="reset" size={14} /> New Chat</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} userInitials={userInitials} />
            ))}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 2 && (
            <div style={{ padding: '0 24px 12px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>Suggested questions:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.text, p.key)}
                    style={{
                      padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: '1.5px solid var(--border)', background: '#fff', color: 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = '#fff'; }}
                  >{p.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(input); }}
              style={{ display: 'flex', gap: 10 }}
            >
              <input
                type="text"
                className="form-input"
                placeholder="Ask about your career, CV, or job matches..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={typing}
                style={{ flex: 1, height: 48 }}
              />
              <button
                type="submit"
                className="btn btn-gradient"
                disabled={!input.trim() || typing}
                style={{ padding: '0 20px', height: 48, minWidth: 52 }}
              >
                {typing ? (
                  <Icon name="spinner" size={18} className="animate-spin" />
                ) : <Icon name="send" size={18} />}
              </button>
            </form>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Responses are AI-generated. Verify important career decisions independently.</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
