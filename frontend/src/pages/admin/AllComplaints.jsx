import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import ComplaintCard from '../../components/ComplaintCard';
import StatusTimeline from '../../components/StatusTimeline';

const STATUS_OPTIONS = ['Open', 'InProgress', 'Resolved'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

export default function AllComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: '', from: '', to: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [historyMap, setHistoryMap] = useState({});
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/complaints/categories').then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    load();
  }, [filters]);

  function load() {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/complaints', { params }).then((res) => setComplaints(res.data)).finally(() => setLoading(false));
  }

  async function toggleHistory(id) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!historyMap[id]) {
      const res = await api.get(`/complaints/${id}/history`);
      setHistoryMap((m) => ({ ...m, [id]: res.data.history }));
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/complaints/${id}/status`, { status, note: notes[id] || '' });
      setNotes((n) => ({ ...n, [id]: '' }));
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function updatePriority(id, priority) {
    try {
      await api.patch(`/complaints/${id}/priority`, { priority });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update priority');
    }
  }

  return (
    <div className="container">
      <h2>All Complaints (Admin)</h2>

      <div className="filters">
        <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
        <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
      </div>

      {loading && <p>Loading...</p>}
      {!loading && complaints.length === 0 && <p className="empty-state">No complaints match these filters.</p>}

      {complaints.map((c) => (
        <ComplaintCard key={c.id} complaint={c}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
            <select value={c.priority || ''} onChange={(e) => updatePriority(c.id, e.target.value)}>
              <option value="" disabled>Set Priority</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {c.status !== 'Resolved' && (
              <>
                <input
                  placeholder="Optional note"
                  value={notes[c.id] || ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                  style={{ padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}
                />
                {c.status === 'Open' && (
                  <button className="btn" onClick={() => updateStatus(c.id, 'InProgress')}>Mark In Progress</button>
                )}
                <button className="btn" style={{ background: '#16a34a' }} onClick={() => updateStatus(c.id, 'Resolved')}>
                  Mark Resolved
                </button>
              </>
            )}

            <button className="btn secondary" onClick={() => toggleHistory(c.id)}>
              {expandedId === c.id ? 'Hide History' : 'View History'}
            </button>
          </div>
          {expandedId === c.id && <StatusTimeline history={historyMap[c.id]} />}
        </ComplaintCard>
      ))}
    </div>
  );
}
