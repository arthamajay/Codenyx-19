import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [tab, setTab] = useState('signin');

  // Sign-in state
  const [siLogin, setSiLogin]       = useState(''); // username or email
  const [siPassword, setSiPassword] = useState('');
  const [siError, setSiError]       = useState('');
  const [siLoading, setSiLoading]   = useState(false);
  const [showSiPw, setShowSiPw]     = useState(false);

  // Sign-up state
  const [suName, setSuName]         = useState('');
  const [suUsername, setSuUsername] = useState('');
  const [suUsernameStatus, setSuUsernameStatus] = useState(''); // '', 'checking', 'available', 'taken'
  const [suAge, setSuAge]           = useState('');
  const [suEmail, setSuEmail]       = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConsent, setSuConsent]   = useState(false);
  const [suError, setSuError]       = useState('');
  const [suLoading, setSuLoading]   = useState(false);
  const [showSuPw, setShowSuPw]     = useState(false);
  const [pwStrength, setPwStrength] = useState({ width: '0%', color: '#f43f5e' });

  const checkPassword = (val) => {
    let s = 0;
    if (val.length >= 8) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^A-Za-z0-9]/.test(val)) s++;
    const widths = ['0%', '25%', '50%', '75%', '100%'];
    const colors = ['#f43f5e', '#f43f5e', '#f59e0b', '#22c55e', '#22c55e'];
    setPwStrength({ width: widths[s], color: colors[s] });
  };

  // Check username availability with debounce
  let usernameTimer = null;
  const handleUsernameChange = (val) => {
    setSuUsername(val);
    setSuUsernameStatus('');
    clearTimeout(usernameTimer);
    if (!val || val.length < 3) return;
    if (!/^[a-z0-9_]{3,20}$/i.test(val)) {
      setSuUsernameStatus('invalid');
      return;
    }
    setSuUsernameStatus('checking');
    usernameTimer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/check-username/${val.toLowerCase()}`);
        const data = await res.json();
        setSuUsernameStatus(data.available ? 'available' : 'taken');
      } catch { setSuUsernameStatus(''); }
    }, 500);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSiError('');
    setSiLoading(true);
    try {
      // Backend expects { login, password } where login = username or email
      const res = await loginUser({ login: siLogin, password: siPassword });
      login(res.data.user, res.data.token);
      const role = res.data.user?.role;
      navigate(role === 'mentor' || role === 'admin' ? '/dashboard' : '/home', { replace: true });
    } catch (err) {
      setSiError('⚠ ' + (err.response?.data?.message || 'Login failed'));
    } finally {
      setSiLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSuError('');
    if (!suUsername) { setSuError('⚠ Username is required.'); return; }
    if (!/^[a-z0-9_]{3,20}$/i.test(suUsername)) { setSuError('⚠ Username: 3–20 chars, letters/numbers/underscore only.'); return; }
    if (suUsernameStatus === 'taken') { setSuError('⚠ That username is already taken.'); return; }
    if (!suConsent) { setSuError('⚠ Please accept the privacy policy.'); return; }
    setSuLoading(true);
    try {
      const res = await registerUser({
        name:     suName,
        username: suUsername.toLowerCase(),
        email:    suEmail,
        password: suPassword,
        age:      suAge ? parseInt(suAge) : 0,
        role:     'user',
      });
      login(res.data.user, res.data.token);
      navigate('/home', { replace: true });
    } catch (err) {
      setSuError('⚠ ' + (err.response?.data?.message || 'Registration failed'));
    } finally {
      setSuLoading(false);
    }
  };

  const usernameHint = () => {
    if (suUsernameStatus === 'checking') return { color: 'var(--text-dim)', text: '⏳ Checking...' };
    if (suUsernameStatus === 'available') return { color: '#86efac', text: '✓ Available' };
    if (suUsernameStatus === 'taken')    return { color: '#fca5a5', text: '✗ Already taken' };
    if (suUsernameStatus === 'invalid')  return { color: '#fcd34d', text: '⚠ 3–20 chars, letters/numbers/underscore' };
    return null;
  };

  return (
    <div className="auth-screen" style={{ display: 'flex' }}>
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🧠</div>
          <span className="auth-brand-name">Sah<span className="brand-accent">ara</span></span>
        </div>
        <h1 className="auth-tagline">You Are <span className="gradient-text">Never</span><br />Alone Here.</h1>
        <p className="auth-desc">A safe, stepped-care mental health ecosystem — connecting youth with community peers, trained volunteers, and licensed crisis therapists.</p>
        <div className="auth-pillars">
          <div className="auth-pillar"><span className="ap-icon">🌊</span><div><div className="ap-title">Community</div><div className="ap-sub">Anonymous community support</div></div></div>
          <div className="auth-pillar"><span className="ap-icon">🤝</span><div><div className="ap-title">I Need Help</div><div className="ap-sub">Volunteer-led peer conversations</div></div></div>
          <div className="auth-pillar"><span className="ap-icon">🆘</span><div><div className="ap-title">SOS Crisis</div><div className="ap-sub">Professional crisis intervention</div></div></div>
        </div>
        <div className="auth-trust">
          <div className="trust-badge">🔒 Your data is private &amp; secure</div>
          <div className="trust-badge">🌱 NGO-backed &amp; non-profit</div>
          <div className="trust-badge">💜 No judgment, ever</div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'signin' ? ' active' : ''}`} onClick={() => { setTab('signin'); setSiError(''); setSuError(''); }}>Sign In</button>
            <button className={`auth-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setSiError(''); setSuError(''); }}>Create Account</button>
          </div>

          {/* ── Sign In ── */}
          {tab === 'signin' && (
            <form className="auth-form" onSubmit={handleSignIn}>
              <div className="auth-welcome">
                <div className="auth-welcome-icon">👋</div>
                <div className="auth-welcome-title">Welcome back</div>
                <div className="auth-welcome-sub">Sign in with your username</div>
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-wrap">
                  <span className="input-icon">@</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="your_username"
                    required
                    value={siLogin}
                    onChange={e => setSiLogin(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔑</span>
                  <input
                    type={showSiPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    required
                    value={siPassword}
                    onChange={e => setSiPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button type="button" className="toggle-pw" onClick={() => setShowSiPw(p => !p)}>
                    {showSiPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              {siError && <div className="form-error">{siError}</div>}
              <button type="submit" className="auth-submit-btn" disabled={siLoading}>
                <span className="btn-text">{siLoading ? '⏳ Signing in...' : 'Sign In'}</span>
              </button>
            </form>
          )}

          {/* ── Sign Up ── */}
          {tab === 'signup' && (
            <form className="auth-form" onSubmit={handleSignUp}>
              <div className="auth-welcome">
                <div className="auth-welcome-icon">🌱</div>
                <div className="auth-welcome-title">Create your safe space</div>
                <div className="auth-welcome-sub">Your identity stays private. Always.</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input type="text" className="form-input" placeholder="Alex" required value={suName} onChange={e => setSuName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" className="form-input" placeholder="18" min="1" max="99" required value={suAge} onChange={e => setSuAge(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-wrap">
                  <span className="input-icon">@</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="quietstar_42"
                    required
                    value={suUsername}
                    onChange={e => handleUsernameChange(e.target.value)}
                    autoComplete="username"
                    maxLength={20}
                  />
                </div>
                {usernameHint() && (
                  <div style={{ fontSize: 12, marginTop: 4, color: usernameHint().color }}>{usernameHint().text}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email address</label>
                <div className="input-wrap">
                  <span className="input-icon">✉️</span>
                  <input type="email" className="form-input" placeholder="you@example.com" required value={suEmail} onChange={e => setSuEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Create password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔑</span>
                  <input
                    type={showSuPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Min. 8 characters"
                    required
                    minLength="8"
                    value={suPassword}
                    onChange={e => { setSuPassword(e.target.value); checkPassword(e.target.value); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="toggle-pw" onClick={() => setShowSuPw(p => !p)}>
                    {showSuPw ? '🙈' : '👁'}
                  </button>
                </div>
                <div className="pw-strength">
                  <div className="pw-bar" style={{ width: pwStrength.width, background: pwStrength.color }}></div>
                </div>
              </div>

              <div className="form-group">
                <label className="consent-label">
                  <input type="checkbox" checked={suConsent} onChange={e => setSuConsent(e.target.checked)} />
                  <span>I agree to the <button type="button" className="auth-link" style={{ background:'none', border:'none', padding:0, cursor:'pointer', font:'inherit' }}>Privacy Policy</button> &amp; understand my data is securely protected</span>
                </label>
              </div>

              {suError && <div className="form-error">{suError}</div>}
              <button type="submit" className="auth-submit-btn" disabled={suLoading || suUsernameStatus === 'taken' || suUsernameStatus === 'checking'}>
                <span className="btn-text">{suLoading ? '⏳ Creating account...' : 'Create Account'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
