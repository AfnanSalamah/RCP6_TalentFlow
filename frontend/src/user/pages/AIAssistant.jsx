import React, { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/common/Icon';
import { aiApi } from '../../api/index';
import { formatLocalTime } from '../../utils/dateTime';

const quickPrompts = [
  { label: 'CV Tips', text: 'Can you review my CV and suggest improvements?' },
  { label: 'Job Matches', text: 'What roles match my profile in the Saudi market?' },
  { label: 'Skill Gaps', text: 'What skills should I learn to advance my career?' },
  { label: 'Career Path', text: 'What career paths should I consider given my background?' },
];

function now() {
  return formatLocalTime(new Date());
}

function Message({ msg, userInitials }) {
  const isUser = msg.role === 'user';
  const formatted = (msg.text || '').split('\n').map((line, i) => {
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
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'linear-gradient(135deg, #0A4174, #4E8EA2)' : '#fff',
          color: isUser ? '#fff' : 'var(--text-primary)',
          border: isUser ? 'none' : '1px solid var(--border)',
          boxShadow: isUser ? '0 4px 12px rgba(79,70,229,0.25)' : 'var(--shadow-sm)',
          fontSize: 14,
          lineHeight: 1.7,
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
  const intro = `Hello ${displayName || 'there'}, I can help review your CV, suggest job matches, identify skill gaps, and plan your next career step.`;
  const [messages, setMessages] = useState([{ role: 'assistant', text: intro, ts: now() }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    setMessages(prev => prev.length && prev[0].role === 'assistant'
      ? [{ ...prev[0], text: intro }, ...prev.slice(1)]
      : prev);
  }, [intro]);

  async function sendMessage(text) {
    const clean = text.trim();
    if (!clean || typing) return;
    setMessages(m => [...m, { role: 'user', text: clean, ts: now() }]);
    setInput('');
    setTyping(true);
    try {
      const res = await aiApi.chat(clean, { portal: 'candidate' });
      setMessages(m => [...m, { role: 'assistant', text: res.answer, ts: now() }]);
    } catch (error) {
      setMessages(m => [...m, { role: 'assistant', text: error.message || 'AI Assistant is unavailable right now. Please try again.', ts: now() }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <AppLayout title="Career Assistant" subtitle="Guidance tailored to the Saudi job market">
      <div className="page-wrapper ai-grid" style={{ display: 'flex', gap: 24, height: 'calc(100vh - 140px)', minHeight: 600 }}>
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }} className="ai-sidebar">
          <div style={{ background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', borderRadius: 16, padding: '20px', color: '#fff', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Icon name="sparkles" size={36} /></div>
            <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Career Assistant</h3>
            <p style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>Your guide to careers in the Kingdom</p>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Suggested questions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => sendMessage(prompt.text)}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #0A4174, #4E8EA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="sparkles" size={20} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>TalentFlow Career Assistant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                Online
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', fontSize: 13, gap: 5 }} onClick={() => setMessages([{ role: 'assistant', text: intro, ts: now() }])}>
              <Icon name="reset" size={14} /> New Chat
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} userInitials={userInitials} />)}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ask about your career, CV, or job matches..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={typing}
                style={{ flex: 1, height: 48 }}
              />
              <button type="submit" className="btn btn-gradient" disabled={!input.trim() || typing} style={{ padding: '0 20px', height: 48, minWidth: 52 }}>
                {typing ? <Icon name="spinner" size={18} className="animate-spin" /> : <Icon name="send" size={18} />}
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
