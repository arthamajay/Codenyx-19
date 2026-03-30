import React, { useState, useEffect } from 'react';
import { getVolunteers, saveChatSession } from '../../api/auth';

const AUTO_REPLIES = [
  'That sounds really hard. Thank you for trusting me with this.',
  "I hear you. Can you tell me a bit more about when this started?",
  "You're not alone in feeling this way. What does a typical day look like for you right now?",
  "It takes a lot of courage to talk about this. I'm really glad you reached out.",
  "That's completely understandable. How has your sleep been?",
  "Let's take this one step at a time. What feels most overwhelming right now?",
];

export default function HelpSection() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatVol, setChatVol] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [escalationAlert, setEscalationAlert] = useState(false);
  const [chatStart, setChatStart] = useState(null);

  useEffect(() => {
    getVolunteers()
      .then(res => setVolunteers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const startChat = (vol) => {
    setChatVol(vol);
    setChatStart(Date.now());
    setMessages([
      { from: 'recv', text: `Hi! I'm ${vol.name}. ${vol.bio} Take all the time you need — I'm here. 💜`, time: now() },
    ]);
    setMsgCount(0);
    setTimeout(() => {
      setMessages(m => [...m, { from: 'recv', text: "What's been on your mind lately? You can start wherever feels comfortable.", time: now() }]);
    }, 2000);
  };

  const endChat = async (escalated = false) => {
    if (chatVol && messages.length > 1) {
      const duration = Math.round((Date.now() - chatStart) / 60000);
      try {
        await saveChatSession({
          volunteerName: chatVol.name,
          messages: messages.map(m => ({ from: m.from === 'sent' ? 'user' : 'volunteer', text: m.text })),
          escalated,
          duration,
        });
      } catch (e) { console.error(e); }
    }
    setChatVol(null);
    setEscalationAlert(false);
    setMsgCount(0);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    const count = msgCount + 1;
    setMsgCount(count);
    setMessages(m => [...m, { from: 'sent', text, time: now() }]);

    const highRisk = ['suicide', 'kill myself', 'end my life', 'hurt myself', 'want to die'].some(w => text.toLowerCase().includes(w));
    if (highRisk || count === 8) {
      setTimeout(() => {
        setEscalationAlert(true);
        setMessages(m => [...m, { from: 'recv', text: "⚠️ I want to make sure you're getting the best support. There's a licensed therapist available right now who can help more than I can. Would that be okay?", time: now() }]);
      }, 1500);
      return;
    }

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { from: 'recv', text: AUTO_REPLIES[Math.min(count - 1, AUTO_REPLIES.length - 1)], time: now() }]);
    }, 1500 + Math.random() * 1000);
  };

  if (chatVol) {
    return (
      <section className="section active">
        <div className="chat-header">
          <button className="back-btn" onClick={() => endChat(false)}>← Back</button>
          <div className="chat-partner-info">
            <div className="chat-avatar" style={{ background: chatVol.color }}>{chatVol.initials}</div>
            <div>
              <div className="chat-partner-name">{chatVol.name}</div>
              <div className="chat-partner-status">🟢 Active · Trained Volunteer</div>
            </div>
          </div>
          <button className="btn btn-danger-outline" onClick={() => setEscalationAlert(true)}>⚠️ Escalate to SOS</button>
        </div>

        {escalationAlert && (
          <div className="chat-alert">
            <div className="chat-alert-content"><strong>⚠️ We've noticed signs of escalating distress.</strong> Would you like us to connect you with a licensed therapist?</div>
            <div className="chat-alert-actions">
              <button className="btn btn-danger-sm" onClick={() => endChat(true)}>Yes, Connect Therapist</button>
              <button className="btn btn-ghost-sm" onClick={() => setEscalationAlert(false)}>I'm OK for now</button>
            </div>
          </div>
        )}

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.from}`}>
              <div className="msg-bubble">{m.text}</div>
              <div className="msg-time">{m.time}</div>
            </div>
          ))}
          {typing && (
            <div className="chat-typing">
              <div className="typing-bubble"><span></span><span></span><span></span></div>
              <small>{chatVol.name.split(' ')[0]} is typing...</small>
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <input className="chat-input" placeholder="Type your message..." value={input}
            onChange={e => setInput(e.target.value)} onKeyUp={e => e.key === 'Enter' && sendMessage()} />
          <button className="send-btn" onClick={sendMessage}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="section active" id="section-help">
      <div className="section-header">
        <div className="section-header-content">
          <div className="sh-icon help-icon-bg">🤝</div>
          <div><h1 className="sh-title">I Need Help</h1><p className="sh-subtitle">Connect privately with a trained NGO volunteer — real support, real humans.</p></div>
        </div>
      </div>
      <div className="help-intro">
        <div className="help-intro-cards">
          {[['🔒','Completely Private','Your conversation stays between you and your volunteer'],
            ['🎓','Trained Volunteers','All volunteers complete NGO-certified peer support training'],
            ['⚡','Usually < 2 min wait','Average match time based on real-time availability']].map(([icon, title, sub]) => (
            <div key={title} className="help-info-card"><span className="hic-icon">{icon}</span><div><div className="hic-title">{title}</div><div className="hic-sub">{sub}</div></div></div>
          ))}
        </div>
      </div>
      <h2 className="volunteer-section-title">Available Volunteers Now</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading volunteers...</div>
      ) : (
        <div className="volunteer-grid">
          {volunteers.map(v => (
            <div key={v._id} className="volunteer-card">
              <div className="vol-header">
                <div className="vol-avatar" style={{ background: v.color }}>{v.initials}</div>
                <div>
                  <div className="vol-name">{v.name}</div>
                  <div className={`vol-status${v.status === 'away' ? ' away' : ''}`}>
                    {v.status === 'available' ? '🟢 Available now' : '🟡 Away · back soon'}
                  </div>
                </div>
              </div>
              <div className="vol-specialties">{v.specialties.map(s => <span key={s} className="vol-tag">{s}</span>)}</div>
              <div className="vol-stats">
                <span>⭐ {v.rating.toFixed(1)}</span>
                <span>💬 {v.sessions} chats</span>
                <span>⚡ {v.responseTime}</span>
              </div>
              <button className="vol-connect-btn" onClick={() => startChat(v)}>
                Connect with {v.name.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
