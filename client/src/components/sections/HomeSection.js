import React, { useState, useEffect, useCallback } from 'react';
import { getStats, logMood, getTodayMoods } from '../../api/auth';

const SLOTS = [
  { key: 'morning',   icon: '🌅', label: 'Morning',   timeHint: '5 AM – 12 PM' },
  { key: 'afternoon', icon: '☀️',  label: 'Afternoon', timeHint: '12 PM – 6 PM' },
  { key: 'evening',   icon: '🌙', label: 'Evening',   timeHint: '6 PM – 12 AM' },
];
const SCORE_LABELS = { 1: 'Very Low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };
const SCORE_EMOJIS = { 1: '😞', 2: '😔', 3: '😐', 4: '🙂', 5: '😄' };

function getCurrentSlot() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)  return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'evening';
}

export default function HomeSection({ navTo }) {
  const [ventsToday, setVentsToday]     = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [todayLogs, setTodayLogs]       = useState([]);

  const [score, setScore]               = useState(null);
  const [note, setNote]                 = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [checkinError, setCheckinError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getStats();
      setVentsToday(res.data.ventsToday || 0);
    } catch (e) { console.error(e); }
    finally { setLoadingStats(false); }
  }, []);

  const fetchTodayLogs = useCallback(async () => {
    try {
      const res = await getTodayMoods();
      setTodayLogs(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchStats(); },     [fetchStats]);
  useEffect(() => { fetchTodayLogs(); }, [fetchTodayLogs]);
  useEffect(() => {
    const t = setInterval(() => { fetchStats(); fetchTodayLogs(); }, 15000);
    return () => clearInterval(t);
  }, [fetchStats, fetchTodayLogs]);

  const handleMoodSubmit = async () => {
    if (!score) return;
    const slot = getCurrentSlot();
    setSubmitting(true);
    setCheckinError(null);
    try {
      await logMood({ score, label: SCORE_LABELS[score], slot, note });
      await fetchTodayLogs();
      setScore(null);
      setNote('');
    } catch (err) {
      if (err.response?.status === 409) {
        setCheckinError('Already logged for this slot today.');
        await fetchTodayLogs();
      } else {
        setCheckinError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section active" id="section-home">

      {/* Hero */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">🌱 NGO Mental Health Initiative</div>
          <h1 className="hero-title">You Are <span className="gradient-text">Never</span><br />Alone Here</h1>
          <p className="hero-subtitle">
            Sahara connects youth with the right level of support — from community peers to trained volunteers to licensed crisis therapists.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navTo('vent')}>Join Community</button>
            <button className="btn btn-ghost"   onClick={() => navTo('help')}>Find Support</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-cards-stack">
            <div className="mini-card mc-1"><span className="mc-icon">💜</span><div className="mc-text"><div className="mc-title">Community heard you</div><div className="mc-sub">Real reactions from real people</div></div></div>
            <div className="mini-card mc-2"><span className="mc-icon">🤝</span><div className="mc-text"><div className="mc-title">Volunteers ready</div><div className="mc-sub">Trained mentors available now</div></div></div>
            <div className="mini-card mc-3"><span className="mc-icon">💬</span><div className="mc-text"><div className="mc-title">Experiences shared</div><div className="mc-sub">{loadingStats ? '...' : ventsToday} posts today</div></div></div>
          </div>
        </div>
      </div>

      {/* Mood Check-In — auto-detects current slot */}
      {(() => {
        const currentSlot = SLOTS.find(s => s.key === getCurrentSlot());
        const alreadyLogged = todayLogs.some(l => l.slot === currentSlot.key);
        const loggedEntry   = todayLogs.find(l => l.slot === currentSlot.key);
        return (
          <div style={{ margin: '0 0 40px', padding: '28px 32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 28 }}>{currentSlot.icon}</span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {alreadyLogged ? `${currentSlot.label} check-in done ✓` : `How are you feeling this ${currentSlot.label.toLowerCase()}?`}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, margin: 0 }}>
                  {alreadyLogged
                    ? `You logged ${SCORE_EMOJIS[loggedEntry?.score]} ${loggedEntry?.label} · ${loggedEntry?.note || 'no note'}`
                    : `${currentSlot.timeHint} · tap a score to log your mood`}
                </p>
              </div>
            </div>

            {alreadyLogged ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {SLOTS.map(s => {
                  const entry = todayLogs.find(l => l.slot === s.key);
                  return (
                    <div key={s.key} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 16px', borderRadius: 10,
                      background: entry ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${entry ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
                      fontSize: 13, color: entry ? '#86efac' : 'var(--text-dim)',
                    }}>
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                      {entry ? <span>{SCORE_EMOJIS[entry.score]} {entry.label}</span> : <span style={{ opacity: 0.4 }}>—</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setScore(n)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '10px 18px', borderRadius: 10, border: '1px solid',
                        borderColor: score === n ? '#6366f1' : 'var(--border)',
                        background: score === n ? 'rgba(99,102,241,0.2)' : 'transparent',
                        cursor: 'pointer', color: 'var(--text)', transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{SCORE_EMOJIS[n]}</span>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{SCORE_LABELS[n]}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note… (optional)"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
                    color: 'var(--text)', fontSize: 13, marginBottom: 14, boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    disabled={!score || submitting}
                    onClick={handleMoodSubmit}
                    style={{
                      padding: '10px 24px', borderRadius: 8, border: 'none',
                      background: !score || submitting ? 'rgba(99,102,241,0.3)' : '#6366f1',
                      color: 'white', fontWeight: 700, fontSize: 14,
                      cursor: !score || submitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Logging…' : 'Log Mood'}
                  </button>
                  {checkinError && <span style={{ fontSize: 12, color: '#fca5a5' }}>{checkinError}</span>}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Pillars */}
      <div className="pillars-section">
        <h2 className="section-title">How Sahara Works</h2>
        <p className="section-subtitle">A stepped-care model designed to meet you exactly where you are</p>
        <div className="pillars-grid">
          <div className="pillar-card" onClick={() => navTo('vent')}>
            <div className="pillar-icon-wrap vent-gradient"><span className="pillar-icon">🌊</span></div>
            <div className="pillar-badge">Community</div>
            <h3 className="pillar-title">Community</h3>
            <p className="pillar-desc">Share your experiences anonymously. Be heard, get likes, read comments from peers and trained volunteers.</p>
            <ul className="pillar-features">
              <li>✓ Anonymous posting</li>
              <li>✓ Like &amp; comment system</li>
              <li>✓ Volunteer blue-tick replies</li>
            </ul>
            <button className="pillar-cta vent-cta">Join Community →</button>
          </div>
          <div className="pillar-card featured-pillar" onClick={() => navTo('help')}>
            <div className="pillar-badge-featured">Most Used</div>
            <div className="pillar-icon-wrap help-gradient"><span className="pillar-icon">🤝</span></div>
            <div className="pillar-badge">Volunteer-Led</div>
            <h3 className="pillar-title">I Need Help</h3>
            <p className="pillar-desc">Private one-on-one chat with trained NGO volunteers. If things escalate, get a warm handoff to a therapist.</p>
            <ul className="pillar-features">
              <li>✓ Trained peer support</li>
              <li>✓ Private encrypted chat</li>
              <li>✓ Smooth escalation path</li>
            </ul>
            <button className="pillar-cta help-cta">Connect Now →</button>
          </div>
          <div className="pillar-card" onClick={() => navTo('journal')}>
            <div className="pillar-icon-wrap" style={{ background: 'rgba(20,184,166,0.2)' }}><span className="pillar-icon">📔</span></div>
            <div className="pillar-badge">Private Journal</div>
            <h3 className="pillar-title">Daily Journal</h3>
            <p className="pillar-desc">Write privately about your day, thoughts, and feelings. Your journal is completely personal and only visible to you.</p>
            <ul className="pillar-features">
              <li>✓ 100% private to you</li>
              <li>✓ Mood-tagged entries</li>
              <li>✓ Builds self-awareness</li>
            </ul>
            <button className="pillar-cta" style={{ color: '#14b8a6' }}>Write Now →</button>
          </div>
        </div>
      </div>

      {/* Health Card Preview */}
      <div className="card-preview-section">
        <div className="card-preview-content">
          <h2 className="section-title">Your Digital Health Card</h2>
          <p className="section-subtitle">Every session and journal entry builds your private health record — giving you continuity of care.</p>
          <button className="btn btn-primary" onClick={() => navTo('card')}>View My Health Card</button>
        </div>
        <div className="card-preview-visual">
          <div className="health-card-mock">
            <div className="hcm-header">
              <div className="hcm-avatar">💜</div>
              <div className="hcm-info">
                <div className="hcm-name">Your Safe Space</div>
                <div className="hcm-id">Sahara · Mental Health</div>
              </div>
              <div className="hcm-safety safe">● Live</div>
            </div>
            <div className="mood-bar-wrap">
              <div className="mood-label">Community Activity Today</div>
              <div className="mood-bars">
                {[40,55,35,65,50,75,80].map((h, i) => (
                  <div key={i} className={`mood-bar${i === 6 ? ' today' : ''}`} style={{ height: h + '%' }}></div>
                ))}
              </div>
            </div>
            <div className="hcm-tags">
              <span className="hcm-tag">🗣 {loadingStats ? '...' : ventsToday} posts today</span>
              <span className="hcm-tag">🤝 Volunteers online</span>
              <span className="hcm-tag">🌱 Community</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
