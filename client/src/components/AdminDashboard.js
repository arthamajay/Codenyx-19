import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminStats, getAdminMentors, createMentor, updateMentor, deleteMentor,
  getAdminUsers, updateUser, getAdminVents, deleteVent,
} from '../api/auth';

const COLORS = ['#6366f1','#8b5cf6','#14b8a6','#f59e0b','#f43f5e','#22c55e'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [users, setUsers] = useState([]);
  const [vents, setVents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add mentor modal
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', age:'', specialties:'', bio:'' });
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, u, v] = await Promise.all([getAdminStats(), getAdminMentors(), getAdminUsers(), getAdminVents()]);
      setStats(s.data); setMentors(m.data); setUsers(u.data); setVents(v.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddMentor = async () => {
    setFormErr('');
    if (!form.name || !form.email || !form.password) { setFormErr('Name, email and password are required'); return; }
    setSaving(true);
    try {
      const res = await createMentor({
        ...form, age: parseInt(form.age) || 25,
        specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
      });
      setMentors(m => [res.data, ...m]);
      setAddModal(false);
      setForm({ name:'', email:'', password:'', age:'', specialties:'', bio:'' });
    } catch (e) { setFormErr(e.response?.data?.message || 'Failed to create mentor'); }
    finally { setSaving(false); }
  };

  const toggleMentorStatus = async (mentor) => {
    const newStatus = mentor.status === 'available' ? 'away' : 'available';
    try {
      const res = await updateMentor(mentor._id, { status: newStatus });
      setMentors(m => m.map(x => x._id === mentor._id ? res.data : x));
    } catch (e) { console.error(e); }
  };

  const toggleMentorActive = async (mentor) => {
    try {
      const res = await updateMentor(mentor._id, { isActive: !mentor.isActive });
      setMentors(m => m.map(x => x._id === mentor._id ? res.data : x));
    } catch (e) { console.error(e); }
  };

  const handleDeleteMentor = async (id) => {
    if (!window.confirm('Remove this mentor permanently?')) return;
    try {
      await deleteMentor(id);
      setMentors(m => m.filter(x => x._id !== id));
    } catch (e) { console.error(e); }
  };

  const toggleUserActive = async (u) => {
    try {
      const res = await updateUser(u._id, { isActive: !u.isActive });
      setUsers(us => us.map(x => x._id === u._id ? res.data : x));
    } catch (e) { console.error(e); }
  };

  const handleDeleteVent = async (id) => {
    try {
      await deleteVent(id);
      setVents(v => v.filter(x => x._id !== id));
    } catch (e) { console.error(e); }
  };

  const s = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: 'rgba(10,10,20,0.9)', borderBottom: '1px solid var(--border)', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🧠</span>
          <span style={{ fontWeight: 800, fontSize: 18 }}>Mind<span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Bridge</span></span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fca5a5', fontWeight: 700, marginLeft: 4 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 32 }}>
          {[['overview','📊 Overview'],['mentors','🤝 Mentors'],['users','👥 Users'],['vents','🌊 Vents']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: tab === key ? 'rgba(99,102,241,0.2)' : 'transparent', color: tab === key ? '#a5b4fc' : 'var(--text-muted)' }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>👤 {user?.name}</span>
          <button onClick={logout} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.1)', color: '#fca5a5', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Dashboard Overview</h2>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading...</div> : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
                  {[
                    { icon: '👥', label: 'Total Users',    value: stats?.totalUsers },
                    { icon: '🤝', label: 'Total Mentors',  value: stats?.totalMentors },
                    { icon: '🌊', label: 'Total Vents',    value: stats?.totalVents },
                    { icon: '💬', label: 'Chat Sessions',  value: stats?.totalSessions },
                  ].map((c, i) => (
                    <div key={i} style={s}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>{c.value ?? '...'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                {stats?.highDistressVents?.length > 0 && (
                  <div style={s}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#fca5a5' }}>🚨 High Distress Vents (needs attention)</h3>
                    {stats.highDistressVents.map(v => (
                      <div key={v._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: v.color + '22', color: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{v.anon?.charAt(0)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{v.anon} <span style={{ fontSize: 11, color: '#fca5a5', marginLeft: 6 }}>distress: {(v.distress * 100).toFixed(0)}%</span></div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{v.text?.slice(0, 120)}...</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* MENTORS */}
        {tab === 'mentors' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>Mentor Management</h2>
              <button onClick={() => setAddModal(true)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>+ Add Mentor</button>
            </div>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading...</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mentors.map(m => (
                  <div key={m._id} style={{ ...s, display: 'flex', alignItems: 'center', gap: 16, opacity: m.isActive ? 1 : 0.5 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: COLORS[mentors.indexOf(m) % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: 'white', flexShrink: 0 }}>
                      {m.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name} <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 4 }}>{m.email}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{m.specialties?.join(', ') || 'No specialties'} · {m.sessions} sessions · ⭐ {m.rating?.toFixed(1)}</div>
                      {m.bio && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2, fontStyle: 'italic' }}>"{m.bio}"</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: m.status === 'available' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: m.status === 'available' ? '#86efac' : '#fcd34d', border: `1px solid ${m.status === 'available' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                        {m.status === 'available' ? '🟢 Available' : '🟡 Away'}
                      </span>
                      <button onClick={() => toggleMentorStatus(m)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                        Toggle Status
                      </button>
                      <button onClick={() => toggleMentorActive(m)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${m.isActive ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`, background: m.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: m.isActive ? '#fcd34d' : '#86efac', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                        {m.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDeleteMentor(m._id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.1)', color: '#fca5a5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>User Management ({users.length})</h2>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading...</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {users.map(u => (
                  <div key={u._id} style={{ ...s, display: 'flex', alignItems: 'center', gap: 14, opacity: u.isActive ? 1 : 0.5 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {u.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name} <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{u.email}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Age: {u.age} {u.age < 15 ? '👶 Minor' : ''} {u.guardianEmail ? `· Guardian: ${u.guardianEmail}` : ''}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{new Date(u.createdAt).toLocaleDateString()}</div>
                    <button onClick={() => toggleUserActive(u)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${u.isActive ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`, background: u.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: u.isActive ? '#fcd34d' : '#86efac', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VENTS */}
        {tab === 'vents' && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Vent Moderation ({vents.length})</h2>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading...</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {vents.map(v => (
                  <div key={v._id} style={{ ...s, position: 'relative' }}>
                    {v.distress > 0.7 && <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(244,63,94,0.15)', color: '#fca5a5', fontWeight: 700 }}>🚨 High Distress {(v.distress*100).toFixed(0)}%</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: v.color + '22', color: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{v.anon?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{v.anon}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{new Date(v.createdAt).toLocaleString()} · {v.mood}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>{v.text}</p>
                    <button onClick={() => handleDeleteVent(v._id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.1)', color: '#fca5a5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                      🗑 Remove Vent
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Mentor Modal */}
      {addModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setAddModal(false)}>
          <div style={{ background: '#12121f', border: '1px solid var(--border-strong)', borderRadius: 20, padding: 32, width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Add New Mentor</h3>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            {[
              ['Name', 'name', 'text', 'Priya M.'],
              ['Email', 'email', 'email', 'priya@mindbridge.ngo'],
              ['Password', 'password', 'password', 'Min 8 characters'],
              ['Age', 'age', 'number', '25'],
              ['Specialties (comma separated)', 'specialties', 'text', 'Anxiety, Depression'],
              ['Bio', 'bio', 'text', 'Short intro...'],
            ].map(([label, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{label}</label>
                <input type={type} className="form-input" placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%' }} />
              </div>
            ))}
            {formErr && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>⚠ {formErr}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={handleAddMentor} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ Creating...' : 'Create Mentor'}
              </button>
              <button onClick={() => setAddModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
