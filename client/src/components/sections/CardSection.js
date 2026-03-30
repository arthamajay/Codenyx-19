import React, { useEffect, useRef, useState } from 'react';
import { getHealthCard } from '../../api/auth';

export default function CardSection({ user }) {
  const canvasRef = useRef(null);
  const [shareModal, setShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHealthCard()
      .then(res => setCardData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!cardData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 760;
    const H = 200;
    canvas.width = W;

    const moods = cardData.moodLogs.length > 0
      ? cardData.moodLogs.map(m => m.score)
      : [3, 4, 3, 5, 4, 5, 6]; // placeholder until user logs moods

    const maxMood = 10;
    const pad = { top: 20, right: 20, bottom: 30, left: 30 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const step = moods.length > 1 ? chartW / (moods.length - 1) : chartW;

    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, 'rgba(99,102,241,0.4)');
    grad.addColorStop(1, 'rgba(99,102,241,0.02)');

    ctx.beginPath();
    ctx.moveTo(pad.left, H - pad.bottom);
    moods.forEach((m, i) => {
      const x = pad.left + i * step;
      const y = pad.top + chartH - (m / maxMood) * chartH;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.bezierCurveTo(x - step / 2, pad.top + chartH - (moods[i-1] / maxMood) * chartH, x - step / 2, y, x, y);
    });
    ctx.lineTo(pad.left + (moods.length - 1) * step, H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    moods.forEach((m, i) => {
      const x = pad.left + i * step;
      const y = pad.top + chartH - (m / maxMood) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.bezierCurveTo(x - step / 2, pad.top + chartH - (moods[i-1] / maxMood) * chartH, x - step / 2, y, x, y);
    });
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const lastX = pad.left + (moods.length - 1) * step;
    const lastY = pad.top + chartH - (moods[moods.length - 1] / maxMood) * chartH;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [cardData]);

  const generateLink = () => {
    const hash = 'mb-share-' + Math.random().toString(36).substr(2, 12).toUpperCase();
    setShareLink(`https://mindbridge.ngo/card/${hash}`);
  };

  if (loading) return (
    <section className="section active">
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading your health card...</div>
    </section>
  );

  const stats = cardData?.stats || {};
  const history = cardData?.history || [];

  return (
    <section className="section active" id="section-card">
      <div className="section-header">
        <div className="section-header-content">
          <div className="sh-icon card-icon-bg">💳</div>
          <div><h1 className="sh-title">Digital Health Card</h1><p className="sh-subtitle">Your private, secure record of emotional health — powering continuity of care.</p></div>
        </div>
        <button className="btn btn-outline" onClick={() => setShareModal(true)}>📤 Share with Therapist</button>
      </div>

      <div className="health-card-full">
        {/* Identity */}
        <div className="hc-card hc-identity">
          <div className="hc-avatar-lg">{user?.name?.charAt(0).toUpperCase() || 'A'}</div>
          <div className="hc-identity-info">
            <div className="hc-name-lg">{user?.name || 'Anonymous User'}</div>
            <div className="hc-id-lg">MindBridge ID: MB-{user?.email?.slice(0,4).toUpperCase()}-{Date.now().toString().slice(-4)}</div>
            <div className="hc-since">Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="hc-safety-badge">
            <div className="safety-dot safe-dot"></div>
            <div><div className="safety-label">Safety Status</div><div className="safety-value safe-text">Safe &amp; Stable</div></div>
          </div>
        </div>

        {/* Mood Chart */}
        <div className="hc-card hc-mood-section">
          <h3 className="hc-card-title">📈 Mood Pattern — Your Check-ins</h3>
          {cardData?.moodLogs?.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
              No mood logs yet. Use the daily check-in on the Home page to start tracking. 📊
            </div>
          ) : (
            <canvas ref={canvasRef} id="moodChart" height="200"></canvas>
          )}
          <div className="mood-avg-row">
            <div className="mood-avg-item"><div className="mav-label">Avg This Week</div><div className={`mav-value ${stats.avgThis ? 'trend-up' : ''}`}>{stats.avgThis ? `${stats.avgThis} / 10` : 'No data'}</div></div>
            <div className="mood-avg-item"><div className="mav-label">Avg Last Week</div><div className="mav-value">{stats.avgLast ? `${stats.avgLast} / 10` : 'No data'}</div></div>
            <div className="mood-avg-item"><div className="mav-label">Lowest Point</div><div className={`mav-value ${stats.lowest ? 'trend-low' : ''}`}>{stats.lowest ? `${stats.lowest} / 10` : 'No data'}</div></div>
            <div className="mood-avg-item"><div className="mav-label">Overall Trend</div><div className={`mav-value ${stats.trend?.includes('↑') ? 'trend-up' : ''}`}>{stats.trend || 'Not enough data'}</div></div>
          </div>
        </div>

        {/* Support History */}
        <div className="hc-card hc-history">
          <h3 className="hc-card-title">📅 Support History ({cardData?.sessionCount || 0} sessions)</h3>
          {history.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
              No support history yet. Start by chatting with a volunteer or logging your mood. 💜
            </div>
          ) : (
            <div className="history-list">
              {history.map((h, i) => (
                <div key={i} className="history-item">
                  <div className="hi-icon">{h.icon}</div>
                  <div className="hi-content"><div className="hi-title">{h.title}</div><div className="hi-sub">{h.sub}</div></div>
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
              <p>This will generate a secure, one-time link for your therapist to view a read-only summary of your health card.</p>
              {shareLink && (
                <div className="share-link-box">
                  <code>{shareLink}</code>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(shareLink)}>Copy</button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={generateLink}>{shareLink ? 'Regenerate' : 'Generate Link'}</button>
              <button className="btn btn-ghost" onClick={() => setShareModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
