import React, { useState, useEffect } from 'react';
import { getClinics, bookClinic } from '../../api/auth';

export default function SosSection() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crisisState, setCrisisState] = useState('idle');
  const [selected, setSelected] = useState(null);
  const [booked, setBooked] = useState({});

  const fetchClinics = async () => {
    try {
      const res = await getClinics();
      setClinics(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClinics(); }, []);

  // Refresh clinic availability every 30s
  useEffect(() => {
    const t = setInterval(fetchClinics, 30000);
    return () => clearInterval(t);
  }, []);

  const activateCrisis = () => {
    setCrisisState('connecting');
    setTimeout(() => setCrisisState('connected'), 2500);
  };

  const handleBook = async (id, e) => {
    e.stopPropagation();
    try {
      await bookClinic(id);
      setBooked(b => ({ ...b, [id]: true }));
      fetchClinics(); // refresh slot counts from DB
    } catch (e) {
      alert(e.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <section className="section active" id="section-sos">
      <div className="sos-header">
        <div className="sos-header-content">
          <div className="sos-pulse-ring">🆘</div>
          <div>
            <h1 className="sh-title">SOS Crisis Support</h1>
            <p className="sh-subtitle">Immediate access to licensed therapists and emergency clinic slots.</p>
          </div>
        </div>
      </div>

      <div className="crisis-zone">
        <div className="crisis-btn-wrap">
          <button className={`crisis-btn${crisisState !== 'idle' ? ' activated' : ''}`} onClick={activateCrisis}>
            <div className="crisis-btn-inner">
              <span className="crisis-btn-icon">{crisisState === 'idle' ? '🤝' : crisisState === 'connecting' ? '⏳' : '✅'}</span>
              <span className="crisis-btn-text">{crisisState === 'idle' ? 'Connect to Therapist Now' : crisisState === 'connecting' ? 'Connecting...' : 'Dr. Ananya is ready'}</span>
              <span className="crisis-btn-sub">{crisisState === 'idle' ? 'Average wait: 90 seconds' : crisisState === 'connecting' ? 'Please wait' : 'Tap to join session'}</span>
            </div>
          </button>
        </div>
        <div className="crisis-or">or call a helpline directly</div>
        <div className="helpline-row">
          {[['iCall','9152987821','Mon–Sat, 8am–10pm'],['Vandrevala Foundation','1860-2662-345','24/7'],['SNEHI','044-24640050','Mon–Sat, 8am–10pm']].map(([name, num, hrs]) => (
            <a key={name} href={`tel:${num}`} className="helpline-card">
              <div className="hl-name">{name}</div>
              <div className="hl-num">{num}</div>
              <div className="hl-hrs">{hrs}</div>
            </a>
          ))}
        </div>
      </div>

      <div className="map-section">
        <div className="map-header">
          <h2 className="section-title" style={{ margin: 0 }}>Live Clinic Availability</h2>
          <div className="map-legend">
            <span className="legend-dot open"></span> Emergency Slot Open &nbsp;
            <span className="legend-dot wait"></span> Waitlist &nbsp;
            <span className="legend-dot full"></span> Full
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading clinics...</div>
        ) : (
          <div className="map-container">
            <div className="city-map">
              {clinics.map(c => (
                <div key={c._id} className="map-pin" style={{ left: c.x + '%', top: c.y + '%' }} onClick={() => setSelected(c._id)}>
                  <div className={`pin-dot ${c.status}`}></div>
                  <div className="pin-label">{c.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>
            <div className="clinic-list">
              {clinics.map(c => (
                <div key={c._id} className={`clinic-card${selected === c._id ? ' selected' : ''}`} onClick={() => setSelected(c._id)}>
                  <div className="cc-header">
                    <div className="cc-name">{c.name}</div>
                    <div className={`cc-status ${c.status}`}>
                      {c.status === 'open' ? '● Emergency Slot' : c.status === 'wait' ? '● Waitlist' : '● Full'}
                    </div>
                  </div>
                  <div className="cc-detail">📍 {c.address} · {c.distance}</div>
                  <div className="cc-detail">⏱ Wait time: {c.wait}{c.slots > 0 ? ` · ${c.slots} slot${c.slots > 1 ? 's' : ''} open` : ''}</div>
                  <button className="cc-btn" onClick={e => handleBook(c._id, e)} disabled={c.status === 'full' || booked[c._id]}>
                    {booked[c._id] ? '✅ Booked' : c.status === 'open' ? '⚡ Book Emergency Slot' : c.status === 'wait' ? '📋 Join Waitlist' : '✗ Currently Full'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
