import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import NoticeCard from '../components/NoticeCard';

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notices').then((res) => setNotices(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2>Notice Board</h2>
      {notices.length === 0 && <p className="empty-state">No notices yet.</p>}
      {notices.map((n) => <NoticeCard key={n.id} notice={n} />)}
    </div>
  );
}
