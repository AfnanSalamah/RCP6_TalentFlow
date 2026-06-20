import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applicantVerifyEmail, applicantResendVerification } from '../../api/auth';

const BRAND = {
  darkest: '#001D39',
  dark:    '#0A4174',
  mid:     '#49769F',
  teal:    '#4E8EA2',
  light:   '#6EA2B3',
  sky:     '#7BBDE8',
  pale:    '#BDD8E9',
};

const RESEND_COUNTDOWN = 60;
const EMAIL_UNAVAILABLE = 'Email verification is temporarily unavailable. Please try again later.';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [challengeToken, setChallengeToken]   = useState(params.get('challenge') || '');
  const [email]                               = useState(params.get('email') || '');
  const [digits, setDigits]       = useState(['', '', '', '', '', '']);
  const [status, setStatus]       = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg]   = useState('');
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [resending, setResending] = useState(false);
  const [shake, setShake]         = useState(false);

  const refs = useRef([]);

  // Auto-focus first box on mount
  useEffect(() => { refs.current[0]?.focus(); }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fullCode = digits.join('');

  const handleChange = (index, value) => {
    // Allow only digits
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setErrorMsg('');

    // Auto-advance
    if (clean && index < 5) {
      refs.current[index + 1]?.focus();
    }
    // Auto-submit when all filled
    if (clean && index === 5) {
      const code = [...next].join('');
      if (code.length === 6) submitCode(code);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...pasted.split(''), ...Array(6 - pasted.length).fill('')];
    setDigits(next);
    if (pasted.length === 6) {
      refs.current[5]?.focus();
      submitCode(pasted);
    } else {
      refs.current[pasted.length]?.focus();
    }
  };

  const submitCode = useCallback(async (code) => {
    if (!challengeToken) {
      setErrorMsg('Session expired. Please register again.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const user = await applicantVerifyEmail(challengeToken, code);
      localStorage.setItem('tf_user_data', JSON.stringify(user));
      setStatus('success');
      setTimeout(() => navigate('/user/dashboard', { replace: true }), 1200);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Invalid code. Please try again.');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setStatus('idle');
        setDigits(['', '', '', '', '', '']);
        refs.current[0]?.focus();
      }, 700);
    }
  }, [challengeToken, navigate]);

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const res = await applicantResendVerification(challengeToken);
      if (res.challenge_token) setChallengeToken(res.challenge_token);
      setCountdown(RESEND_COUNTDOWN);
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(res.email_sent === false ? (res.message || EMAIL_UNAVAILABLE) : '');
      refs.current[0]?.focus();
    } catch (err) {
      setErrorMsg(EMAIL_UNAVAILABLE);
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c)
    : 'your email';

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(145deg, ${BRAND.darkest} 0%, ${BRAND.dark} 55%, ${BRAND.teal} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: '8%', right: '12%', width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, ${BRAND.sky}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', left: '8%', width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${BRAND.teal}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', marginBottom: 10,
          }} onClick={() => navigate('/')}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `linear-gradient(135deg, ${BRAND.dark}, ${BRAND.sky})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, color: '#fff', fontWeight: 900,
              boxShadow: `0 8px 24px ${BRAND.dark}55`,
            }}>T</div>
            <span style={{ fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.03em' }}>TalentFlow</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 24,
          padding: '44px 40px',
          boxShadow: `0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)`,
        }}>
          {status === 'success' ? (
            <SuccessState />
          ) : (
            <>
              {/* Icon */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                  background: `linear-gradient(135deg, ${BRAND.dark}18, ${BRAND.sky}28)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${BRAND.pale}`,
                }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={BRAND.dark} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <path d="m2 7 10 7 10-7" />
                  </svg>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.03em' }}>
                  Verify your email
                </h1>
                <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: BRAND.dark }}>{maskedEmail}</strong>
                </p>
              </div>

              {/* OTP Boxes */}
              <div style={{
                display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28,
                animation: shake ? 'shake 0.5s ease' : 'none',
              }}>
                <style>{`
                  @keyframes shake {
                    0%,100%{transform:translateX(0)}
                    20%{transform:translateX(-8px)}
                    40%{transform:translateX(8px)}
                    60%{transform:translateX(-6px)}
                    80%{transform:translateX(6px)}
                  }
                  @keyframes popIn {
                    0%{transform:scale(0.85);opacity:0}
                    100%{transform:scale(1);opacity:1}
                  }
                  .otp-box:focus { outline: none; border-color: ${BRAND.dark} !important; box-shadow: 0 0 0 3px ${BRAND.sky}44 !important; }
                `}</style>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    className="otp-box"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    disabled={status === 'loading'}
                    style={{
                      width: 54, height: 64,
                      textAlign: 'center',
                      fontSize: 28, fontWeight: 800,
                      color: status === 'error' ? '#DC2626' : BRAND.dark,
                      border: `2.5px solid ${status === 'error' ? '#FCA5A5' : d ? BRAND.dark : '#E2E8F0'}`,
                      borderRadius: 14,
                      background: d ? `${BRAND.pale}44` : '#F8FAFC',
                      transition: 'all 0.15s ease',
                      cursor: 'text',
                      caretColor: BRAND.dark,
                      boxShadow: d ? `0 4px 12px ${BRAND.sky}33` : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Error */}
              {errorMsg && (
                <div style={{
                  padding: '12px 16px', borderRadius: 12, background: '#FEF2F2',
                  border: '1px solid #FECACA', marginBottom: 20, textAlign: 'center',
                  animation: 'popIn 0.2s ease',
                }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#DC2626' }}>{errorMsg}</p>
                </div>
              )}

              {/* Verify button */}
              <button
                onClick={() => submitCode(fullCode)}
                disabled={fullCode.length < 6 || status === 'loading'}
                style={{
                  width: '100%', height: 54, borderRadius: 14, border: 'none',
                  fontSize: 16, fontWeight: 800, cursor: fullCode.length < 6 ? 'not-allowed' : 'pointer',
                  background: fullCode.length === 6
                    ? `linear-gradient(135deg, ${BRAND.darkest}, ${BRAND.dark})`
                    : '#E2E8F0',
                  color: fullCode.length === 6 ? '#fff' : '#94A3B8',
                  transition: 'all 0.2s ease',
                  boxShadow: fullCode.length === 6 ? `0 8px 24px ${BRAND.dark}44` : 'none',
                  marginBottom: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {status === 'loading' ? (
                  <>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      display: 'inline-block',
                      animation: 'spin 0.65s linear infinite',
                    }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    Verifying…
                  </>
                ) : 'Verify Email →'}
              </button>

              {/* Resend */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#64748B', marginBottom: 6 }}>Didn't receive the code?</p>
                {countdown > 0 ? (
                  <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>
                    Resend in <strong style={{ color: BRAND.dark }}>{countdown}s</strong>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: 700, color: BRAND.dark,
                      textDecoration: 'underline', textUnderlineOffset: 3,
                    }}
                  >
                    {resending ? 'Sending…' : 'Resend Code'}
                  </button>
                )}
              </div>

              {/* Back to login */}
              <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: '#94A3B8', fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <style>{`
        @keyframes scaleIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
        @keyframes checkDraw{0%{stroke-dashoffset:50}100%{stroke-dashoffset:0}}
        .success-ring{animation:scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .success-check{stroke-dasharray:50;animation:checkDraw 0.4s 0.3s ease forwards;stroke-dashoffset:50}
      `}</style>
      <div className="success-ring" style={{
        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
        background: 'linear-gradient(135deg, #059669, #34D399)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(5,150,105,0.4)',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline className="success-check" points="4 12 9 17 20 7" />
        </svg>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 10, letterSpacing: '-0.02em' }}>
        Email Verified!
      </h2>
      <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6 }}>
        Your account is confirmed.<br />Redirecting to your dashboard…
      </p>
    </div>
  );
}
