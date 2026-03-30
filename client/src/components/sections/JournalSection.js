import React, { useState, useEffect, useCallback } from 'react';
import { getJournal, postJournal, deleteJournal } from '../../api/auth';

const MOOD_TAGS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😵', label: 'Overwhelmed' },
  { emoji: '🌱', label: 'Hopeful' },
  { emoji: '😶', label: 'Numb' },
];

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function JournalSection({ user }) {
  const isKid = user && user.age < 15;
  const [entries, setEntries]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [title, setTitle]           = useState('');
  const [content, setContent]       = useState('');
  const [mood, setMood]             = useState('');
  const [emoji, setEmoji]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewEntry, setViewEntry]   = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await getJournal();
      setEntries(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await postJournal({ title, content, mood, emoji });
      setEntries(e => [res.data, ...e]);
      setModalOpen(false);
      setTitle(''); setContent(''); setMood(''); setEmoji('');
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteJournal(id);
      setEntries(e => e.filter(x => x._id !== id));
      setDeleteConfirm(null);
      if (viewEntry?._id === id) setViewEntry(null);
    } catch (e) { console.error(e); }
  };

  const selectMoodTag = (tag) => {
    setMood(tag.label);
    setEmoji(tag.emoji);
  };

  return (
    <section className="section active" id="section-journal">
      <div className="section-header">
        <div className="section-header-content">
          <div className="sh-icon" style={{ background: 'rgba(20,184,166,0.2)' }}>📔</div>
          <div>
            <h1 className="sh-title">{isKid ? 'My Feelings Diary' : 'My Journal'}</h1>
            <p className="sh-subtitle">{isKid ? 'Write your thoughts here. Only you can see this.' : 'Your private space to reflect. Completely personal, never shared.'}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          {isKid ? '✏️ Write in Diary' : '+ New Entry'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📔</div>
          Loading your journal...
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📔</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{isKid ? 'Your diary is empty!' : 'Your journal is empty'}</div>
          <div style={{ fontSize: 14, marginBottom: 24 }}>{isKid ? 'Write your first diary entry. Tell me how you feel today!' : 'Start writing to track your thoughts and feelings over time.'}</div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>{isKid ? '✏️ Write First Entry' : 'Write First Entry'}</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {entries.map(e => (
            <div key={e._id} className="vent-card" style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => setViewEntry(e)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {e.emoji && <span style={{ fontSize: 22 }}>{e.emoji}</span>}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{e.title || (isKid ? 'My Entry' : 'Journal Entry')}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{timeAgo(e.createdAt)}</div>
                  </div>
                </div>
                {e.mood && (
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(20,184,166,0.15)', color: '#5eead4', border: '1px solid rgba(20,184,166,0.3)' }}>
                    {e.mood}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {e.content}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={ev => { ev.stopPropagation(); setDeleteConfirm(e._id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">{isKid ? '✏️ Write in My Diary' : '📔 New Journal Entry'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ color: 'var(--text)' }}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <input type="text" className="form-input"
                  placeholder={isKid ? 'Give it a title (optional)' : 'Title (optional)'}
                  value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {isKid ? 'How are you feeling right now?' : 'Tag your mood (optional)'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {MOOD_TAGS.map(tag => (
                    <button key={tag.label}
                      onClick={() => selectMoodTag(mood === tag.label ? { label: '', emoji: '' } : tag)}
                      style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        background: mood === tag.label ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${mood === tag.label ? 'rgba(20,184,166,0.5)' : 'var(--border)'}`,
                        color: mood === tag.label ? '#5eead4' : 'var(--text-muted)',
                      }}>
                      {tag.emoji} {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea className="vent-textarea" style={{ minHeight: 180 }}
                placeholder={isKid ? 'Write anything you want here. This is your private diary 💜' : 'Write freely. This is your private space — no one else can see this...'}
                value={content} onChange={e => setContent(e.target.value)} />
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                🔒 {isKid ? 'Only you can read this.' : 'This entry is private and only visible to you.'}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !content.trim()}>
                {submitting ? '⏳ Saving...' : isKid ? '💾 Save Entry' : 'Save Entry'}
              </button>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Entry Modal */}
      {viewEntry && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewEntry(null)}>
          <div className="modal-box" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {viewEntry.emoji && <span style={{ fontSize: 24 }}>{viewEntry.emoji}</span>}
                <div>
                  <h3 className="modal-title">{viewEntry.title || (isKid ? 'My Entry' : 'Journal Entry')}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{timeAgo(viewEntry.createdAt)}</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setViewEntry(null)}>×</button>
            </div>
            <div style={{ padding: '0 0 24px', fontSize: 15, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {viewEntry.content}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewEntry(null)}>Close</button>
              <button className="btn btn-danger-outline" onClick={() => { setDeleteConfirm(viewEntry._id); setViewEntry(null); }}>🗑 Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Entry?</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">This entry will be permanently deleted and cannot be recovered.</div>
            <div className="modal-footer">
              <button className="btn btn-danger-sm" onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
