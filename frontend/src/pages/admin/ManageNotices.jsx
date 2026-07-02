import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import NoticeCard from '../../components/NoticeCard';

export default function ManageNotices() {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  function load() {
    api.get('/notices').then((res) => setNotices(res.data));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/notices', { title, content, isImportant });
      setTitle('');
      setContent('');
      setIsImportant(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post notice');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h2>Manage Notices</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
              Mark as Important (pins to top + emails all residents)
            </label>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post Notice'}</button>
        </form>
      </div>

      <h3 style={{ marginTop: 24 }}>All Notices</h3>
      {notices.map((n) => <NoticeCard key={n.id} notice={n} />)}
    </div>
  );
}
