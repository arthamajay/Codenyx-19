import React, { useEffect, useRef, useState } from 'react';
import { getHealthCard } from '../../api/auth';

function MoodChart({ moodLogs }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || moodLogs.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 700;
    const H = 160;
    canvas.width = W;
    const moods = moodLogs.map(m => m.score);
    const pad = { top: 16, right: 16, bottom: 24, left: 28 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const step = moods.length > 1 ? cW / (moods.length - 1) : cW;
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, 'rgba(99,102,241,0.35)');
    grad.addColorStop(1, 'rgba(99,102,241,0.02)');
    ctx.beginPath();
    ctx.moveTo(pad.left, H - pad.bottom);
    moods.forEach((m, i) => {
      const x = pad.left + i * step;
      const y = pad.top + cH - (m / 5) * cH;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.bezierCurveTo(x - step/2, pad.top + cH - (moods[i-1]/5)*cH, x - step/2, y, x, y);
    });
    ctx.lineTo(pad.left + (moods.length-1)*step, H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath();
    moods.forEach((m, i) => {
      const x = pad.left + i * step;
      const y = pad.top + cH - (m / 5) * cH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.bezierCurveTo(x - step/2, pad.top + cH - (moods[i-1]/5)*cH, x - step/2, y, x, y);
    });
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5; ctx.stroke();
    // Last point dot
    const lx = pad.left + (moods.length-1)*step;
    const ly = pad.top + cH - (moods[moods.length-1]/5)*cH;
    ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI*2);
    ctx.fillStyle = '#8b5cf6'; ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    // Y labels
    ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'right';
    [1,2,3,4,5].forEach(v => {
      const y = pad.top + cH - (v/5)*cH;
      ctx.fillText(v, pad.left - 4, y + 3);
    });
  }, [moodLogs]);
  if (moodLogs.length === 0) return (
    <div style={{ padding:'24px', textAlign:'center', color:'var(--text-dim)', fontSize:13 }}>
      No mood logs yet. Use the daily check-in on the Home page to start tracking. 📊
    </div>
  );
  return <canvas ref={canvasRef} height="160" style={{ width:'100%', borderRadius:8 }} />;
}

export default function CardSection({ user }) {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [shareModal, setShareModal] = useState(false);
  const [shareLink, setShareLink]   = useState('');

  useEffect(() => {
    getHealthCard()
      .then(r => setCardData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="section active">
      <div style={{ textAlign:'center', padding:'80px', color:'var(--text-muted)' }}>Loading your health card...</div>
    </section>
  );

  const d  = cardData || {};
  const dl = d.distressLevel || { label:'Stable', color:'#22c55e', bg:'rgba(34,197,94,0.12)', dot:'#22c55e' };
  const s  = d.stats || {};

  const moodEmoji = { 'Very Low':'😞', 'Low':'😔', 'Okay':'😐', 'Good':'🙂', 'Great':'😄' };

  return (
    <section className="section active" id="section-card">
      <div className="section-header">
        <div className="section-header-content">
          <div className="sh-icon card-icon-bg">💳</div>
          <div>
            <h1 className="sh-title">Health Card</h1>
            <p className="sh-subtitle">Your private emotional health record — built from every check-in, session and journal entry.</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={() => setShareModal(true)}>📤 Share with Therapist</button>
      </div>

      <div className="health-card-full">

        {/* ── Identity + Distress Score ── */}
        <div className="hc-card" style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'white', flexShrink:0 }}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:20 }}>{user?.name || 'Anonymous'}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
              @{user?.username} &nbsp;·&nbsp; Member since {new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.25)' }}>
                📊 {d.totalCheckins || 0} check-ins
              </span>
              <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'rgba(20,184,166,0.12)', color:'#5eead4', border:'1px solid rgba(20,184,166,0.25)' }}>
                🤝 {d.sessionCount || 0} sessions
              </span>
              <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'rgba(139,92,246,0.12)', color:'#c4b5fd', border:'1px solid rgba(139,92,246,0.25)' }}>
                📔 {d.journalCount || 0} journal entries
              </span>
            </div>
          </div>

          {/* Distress Score — the key indicator */}
          <div style={{ padding:'20px 28px', borderRadius:16, background:dl.bg, border:`1px solid ${dl.color}44`, textAlign:'center', flexShrink:0 }}>
            <div style={{ fontSize:11, color:'var(--text-dim)', fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Distress Score</div>
            <div style={{ fontSize:40, fontWeight:900, color:dl.color, lineHeight:1 }}>{d.distressScore ?? '—'}</div>
            <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>out of 10</div>
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:dl.color, boxShadow:`0 0 6px ${dl.color}` }}></div>
              <span style={{ fontSize:13, fontWeight:700, color:dl.color }}>{dl.label}</span>
            </div>
          </div>
        </div>

        {/* ── Quick Stats Row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
          {[
            { icon:'📈', label:'Avg Mood This Week', value: s.avgThis ? `${s.avgThis}/5` : '—', color: s.avgThis >= 3.5 ? '#86efac' : s.avgThis >= 2.5 ? '#fcd34d' : '#fca5a5' },
            { icon:'📉', label:'Avg Mood Last Week', value: s.avgLast ? `${s.avgLast}/5` : '—', color:'var(--text)' },
            { icon:'🔥', label:'Check-in Streak',    value: `${s.streak || 0} days`,              color: s.streak >= 7 ? '#86efac' : s.streak >= 3 ? '#fcd34d' : 'var(--text)' },
            { icon:'⏱',  label:'Last Check-in',      value: s.daysSinceLastCheckin === 0 ? 'Today' : s.daysSinceLastCheckin === 1 ? 'Yesterday' : s.daysSinceLastCheckin < 999 ? `${s.daysSinceLastCheckin}d ago` : 'Never', color: s.daysSinceLastCheckin > 7 ? '#fca5a5' : '#86efac' },
            { icon:'🆘', label:'Crisis Escalations', value: d.escalations || 0,                   color: d.escalations > 0 ? '#fca5a5' : '#86efac' },
            { icon:'⏳', label:'Total Support Time',  value: d.totalMins ? `${d.totalMins} min` : '—', color:'var(--text)' },
          ].map(item => (
            <div key={item.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{item.icon}</div>
              <div style={{ fontSize:20, fontWeight:800, color:item.color }}>{item.value}</div>
              <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* ── Mood Trend Chart ── */}
        <div className="hc-card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
            <h3 className="hc-card-title" style={{ margin:0 }}>📈 Mood Trend — Last 30 Days</h3>
            <div style={{ display:'flex', gap:8 }}>
              <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, fontWeight:600,
                background: s.trend?.includes('↑') ? 'rgba(34,197,94,0.12)' : s.trend?.includes('↓') ? 'rgba(244,63,94,0.12)' : 'rgba(255,255,255,0.05)',
                color: s.trend?.includes('↑') ? '#86efac' : s.trend?.includes('↓') ? '#fca5a5' : 'var(--text-muted)',
                border: `1px solid ${s.trend?.includes('↑') ? 'rgba(34,197,94,0.3)' : s.trend?.includes('↓') ? 'rgba(244,63,94,0.3)' : 'var(--border)'}` }}>
                {s.trend || 'Not enough data'}
              </span>
            </div>
          </div>
          <MoodChart moodLogs={d.moodLogs || []} />

          {/* Slot breakdown */}
          {s.slotCounts && (
            <div style={{ display:'flex', gap:12, marginTop:16, flexWrap:'wrap' }}>
              {[['🌅','morning','Morning'],['☀️','afternoon','Afternoon'],['🌙','evening','Evening']].map(([icon,key,label]) => (
                <div key={key} style={{ flex:1, minWidth:100, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', textAlign:'center' }}>
                  <div style={{ fontSize:18 }}>{icon}</div>
                  <div style={{ fontSize:18, fontWeight:700, marginTop:4 }}>{s.slotCounts[key] || 0}</div>
                  <div style={{ fontSize:11, color:'var(--text-dim)' }}>{label} check-ins</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recurring Mood Themes ── */}
        {d.topMoods?.length > 0 && (
          <div className="hc-card">
            <h3 className="hc-card-title">🏷️ Recurring Mood Themes</h3>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {d.topMoods.map(({ label, count }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:12, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
                  <span style={{ fontSize:20 }}>{moodEmoji[label] || '😶'}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{label}</div>
                    <div style={{ fontSize:11, color:'var(--text-dim)' }}>{count} times logged</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Distress Breakdown ── */}
        <div className="hc-card" style={{ background: dl.bg, border:`1px solid ${dl.color}33` }}>
          <h3 className="hc-card-title">🧠 Mental Health Assessment</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            {[
              { label:'Mood Level',       value: s.avgThis ? (s.avgThis >= 4 ? 'Good' : s.avgThis >= 3 ? 'Moderate' : 'Low') : 'No data',   ok: s.avgThis >= 3 },
              { label:'Engagement',       value: s.streak >= 3 ? 'Consistent' : s.streak >= 1 ? 'Occasional' : 'Disengaged',                ok: s.streak >= 3 },
              { label:'Crisis History',   value: d.escalations > 0 ? `${d.escalations} escalation${d.escalations > 1 ? 's' : ''}` : 'None', ok: d.escalations === 0 },
              { label:'Support Seeking',  value: d.sessionCount > 0 ? `${d.sessionCount} session${d.sessionCount > 1 ? 's' : ''}` : 'None', ok: d.sessionCount > 0 },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:10, background:'rgba(0,0,0,0.15)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: item.ok ? '#22c55e' : '#f59e0b', flexShrink:0 }}></div>
                <div>
                  <div style={{ fontSize:12, color:'var(--text-dim)' }}>{item.label}</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:'12px 16px', borderRadius:10, background:'rgba(0,0,0,0.15)', fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>
            {d.distressScore <= 2 && '✅ You appear to be in a stable state. Keep up the daily check-ins and journaling — consistency is key.'}
            {d.distressScore > 2 && d.distressScore <= 5 && '⚠️ Some signs of moderate stress detected. Consider reaching out to a mentor for a chat session.'}
            {d.distressScore > 5 && '🆘 High distress indicators detected. We strongly recommend connecting with a mentor or using the SOS feature.'}
          </div>
        </div>

        {/* ── Activity Timeline ── */}
        <div className="hc-card">
          <h3 className="hc-card-title">📅 Activity Timeline</h3>
          {d.timeline?.length === 0 ? (
            <div style={{ padding:'20px', color:'var(--text-muted)', textAlign:'center', fontSize:13 }}>
              No activity yet. Start by logging your mood or chatting with a mentor. 💜
            </div>
          ) : (
            <div className="history-list">
              {d.timeline?.map((h, i) => (
                <div key={i} className="history-item" style={{ borderLeft:`3px solid ${h.type === 'crisis' ? '#f43f5e' : h.type === 'journal' ? '#14b8a6' : '#6366f1'}`, paddingLeft:12 }}>
                  <div className="hi-icon">{h.icon}</div>
                  <div className="hi-content">
                    <div className="hi-title">{h.title}</div>
                    <div className="hi-sub">{h.sub}</div>
                  </div>
                  <div className="hi-date">{h.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Share Modal */}
      {shareModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShareModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Share Health Card</h3>
              <button className="modal-close" onClick={() => setShareModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Generate a secure, read-only link for your therapist or mentor to view your health card summary.</p>
              {shareLink && (
                <div className="share-link-box">
                  <code>{shareLink}</code>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(shareLink)}>Copy</button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShareLink(`https://sahara.ngo/card/${Math.random().toString(36).slice(2, 14).toUpperCase()}`)}>
                {shareLink ? 'Regenerate' : 'Generate Link'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShareModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
