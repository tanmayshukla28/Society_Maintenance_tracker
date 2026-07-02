import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import ComplaintCard from '../../components/ComplaintCard';
import StatusTimeline from '../../components/StatusTimeline';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api.get('/complaints/mine').then((res) => setComplaints(res.data)).finally(() => setLoading(false));
  }

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2>My Complaints</h2>
      {complaints.length === 0 && <p className="empty-state">You haven't raised any complaints yet.</p>}
      {complaints.map((c) => (
        <ComplaintCard key={c.id} complaint={c}>
          <button className="btn secondary" style={{ marginTop: 10 }} onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
            {expandedId === c.id ? 'Hide History' : 'View History'}
          </button>
          {expandedId === c.id && <StatusTimeline history={c.history} />}
        </ComplaintCard>
      ))}
    </div>
  );
}
