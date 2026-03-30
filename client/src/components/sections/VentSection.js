import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVents, postVent, reactToVent } from '../../api/auth';

const moodEmoji = { anxious: '😰', sad: '😢', overwhelmed: '😵', hopeful: '🌱', angry: '😤', numb: '😶' };
const ANON_NAMES  = ['Quiet Star','Fading Light','Open Sky','Silver Cloud','Ember Glow','Distant Shore','Rising Tide','Velvet Night','Amber Dusk','Pale Moon'];
const ANON_COLORS = ['#6366f1','#8b5cf6','#14b8a6','#f59e0b','#f43f5e','#22c55e'];

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function VentSection({ navTo }) {
  const [vents, setVents]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [modalOpen, setModalOpen]       = useState(false);
  const [ventText, setVentText]         = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [distressLevel, setDistressLevel] = useState(0);
  const [distressBanner, setDistressBanner] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [newVentBanner, setNewVentBanner] = useState(false);
  const latestIdRef = useRef(null);

  const fetchVents = useCallback(async (silent = false) => {
    try {
      const res = await getVents();
      const data = res.data;
      if (!silent) {
        setVents(data);
        if (data.length > 0) latestIdRef.current = data[0]._id;
      } else {
        // silent poll — check if there's a new vent from someone else
        if (data.length > 0 && data[0]._id !== latestIdRef.current) {
          setVents(data);
          latestIdRef.current = data[0]._id;
          setNewVentBanner(true);
          setTimeout(() => setNewVentBanner(false), 5000);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // Initial load
  useEffect(() => { fetchVents(false); }, [fetchVents]);

  // Poll every 5s for real-time updates from other users
  useEffect(() => {
    const t = setInterval(() => fetchVents(true), 5000);
    return () => clearInterval(t);
  }, [fetchVents]);

  const analyzeText = (text) => {
    const words = ['cant',"can't",'hopeless','worthless','hurt','pain','die','end it','give up','nobody','alone','scared','suicidal','numb','lost','broken','exhausted','empty','pointless'];
    const lower = text.toLowerCase();
    const matches = words.filter(w => lower.includes(w));
    setDistressLevel(Math.min(matches.length / 3, 1));
  };

  const submitVent = async () => {
    if (!ventText.trim()) return;
    setSubmitting(true);
    const i = Math.floor(Math.random() * ANON_NAMES.length);
    try {
      const res = await postVent({
        anon:     ANON_NAMES[i],
        color:    ANON_COLORS[i % ANON_COLORS.length],
        mood:     selectedMood || 'numb',
        text:     ventText.trim(),
        distress: distressLevel,
      });
      setVents(v => [res.data, ...v]);
      latestIdRef.current = res.data._id;
      setModalOpen(false);
      setVentText('');
      setSelectedMood('');
      setDistressLevel(0);
      if (distressLevel > 0.6) setTimeout(() => setDistressBanner(true), 1200);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to post vent. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handleReact = async (ventId, emoji) => {
    try {
      const res = await reactToVent(ventId, emoji);
      setVents(v => v.map(vent => vent._id === ventId ? res.data : vent));
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'all' ? vents : vents.filter(v => v.mood === filter);

  const meterColor = distressLevel === 0 ? '#22c55e' : distressLevel < 0.4 ? '#f59e0b' : distressLevel < 0.7 ? '#f97316' : '#f43f5e';
  const meterText  = distressLevel === 0
    ? 'AI is listening and here if you need support...'
    : distressLevel < 0.4 ? "We notice some stress. Remember you're not alone here."
    : distressLevel < 0.7 ? '⚠️ We hear you. This sounds really heavy — our volunteers are here.'
    : '🆘 This sounds very serious. Would you like help right now?';

  return (
    <section className="section active" id="section-vent">
      <div className="section-header">
        <div className="section-header-content">
          <div className="sh-icon vent-icon-bg">🌊</div>
          <div>
            <h1 className="sh-title">Vent Mode</h1>
            <p className="sh-subtitle">A safe, anonymous space to be heard. No judgment, only support.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Write a Vent</button>
      </div>

      {/* New vent from another user */}
      {newVentBanner && (
        <div className="alert-banner" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', marginBottom: 16 }}>
          <div className="alert-icon">🌊</div>
          <div className="alert-content">Someone just posted a new vent — feed updated.</div>
          <button className="alert-close" onClick={() => setNewVentBanner(false)}>×</button>
        </div>
      )}

      {/* High distress nudge */}
      {distressBanner && (
        <div className="alert-banner distress-banner">
          <div className="alert-icon">💜</div>
          <div className="alert-content">
            <strong>Hey, we noticed your vent sounds really heavy.</strong> Would you like to talk to a trained volunteer?
          </div>
          <button className="alert-cta" onClick={() => navTo && navTo('help')}>Connect Now</button>
          <button className="alert-close" onClick={() => setDistressBanner(false)}>×</button>
        </div>
      )}

      {/* Mood filters */}
      <div className="mood-filters">
        {[['all','All'],['anxious','😰 Anxious'],['sad','😢 Sad'],['overwhelmed','😵 Overwhelmed'],['hopeful','🌱 Hopeful'],['angry','😤 Angry']].map(([key, label]) => (
          <button key={key} className={`filter-btn${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌊</div>
          Loading community vents...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💜</div>
          {filter === 'all' ? 'No vents yet. Be the first to share.' : `No ${filter} vents yet.`}
        </div>
      ) : (
        <div className="vent-feed">
          {filtered.map(v => (
            <div key={v._id} className={`vent-card${v.distress > 0.7 ? ' flagged' : ''}`}>
              {v.distress > 0.7 && <div className="vc-ai-flag">🤖 High distress</div>}
              <div className="vc-header">
                <div className="vc-anon" style={{ background: v.color + '22', color: v.color }}>
                  {v.anon.charAt(0)}
                </div>
                <div className="vc-meta">
                  <div className="vc-username">{v.anon}</div>
                  <div className="vc-time">{timeAgo(v.createdAt)}</div>
                </div>
                <span className={`vc-mood-tag mood-${v.mood}`}>
                  {moodEmoji[v.mood] || '😶'} {v.mood.charAt(0).toUpperCase() + v.mood.slice(1)}
                </span>
              </div>
              <p className="vc-text">{v.text}</p>
              <div className="vc-reactions">
                {['🤍','💜','🌱'].map(emoji => (
                  <button key={emoji} className="reaction-btn" onClick={() => handleReact(v._id, emoji)}>
                    {emoji} <span>{v.reactions?.[emoji] ?? 0}</span>
                  </button>
                ))}
                {v.distress > 0.7 && (
                  <button className="reaction-btn" style={{ marginLeft: 'auto', color: '#c4b5fd' }}
                    onClick={() => navTo && navTo('help')}>
                    🤝 Offer support
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Vent Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-box vent-modal-box">
            <div className="modal-header">
              <h3 className="modal-title">🌊 Write Your Vent</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="vent-reminder">This is anonymous. No one will know it's you. Say whatever you need to say. 💜</p>
              <div style={{ marginBottom: 16 }}>
                <label className="mood-label-title">How are you feeling?</label>
                <div className="mood-options">
                  {['anxious','sad','overwhelmed','hopeful','angry','numb'].map(m => (
                    <button key={m} className={`mood-opt${selectedMood === m ? ' selected' : ''}`} onClick={() => setSelectedMood(m)}>
                      {moodEmoji[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="vent-textarea"
                placeholder="What's on your mind? Let it out..."
                value={ventText}
                onChange={e => { setVentText(e.target.value); analyzeText(e.target.value); }}
              />
              <div className="ai-sentiment-bar">
                <div className="ai-icon">🤖</div>
                <div className="ai-text">{meterText}</div>
                <div className="ai-meter-wrap">
                  <div className="ai-meter" style={{ width: (distressLevel * 100) + '%', background: meterColor }}></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={submitVent} disabled={submitting || !ventText.trim()}>
                {submitting ? '⏳ Posting...' : 'Post Anonymously'}
              </button>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
