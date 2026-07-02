import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';

export default function RaiseComplaint() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/complaints/categories').then((res) => {
      setCategories(res.data);
      if (res.data.length) setCategoryId(res.data[0].id);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('categoryId', categoryId);
      formData.append('description', description);
      if (photo) formData.append('photo', photo);

      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Complaint raised successfully!');
      setDescription('');
      setPhoto(null);
      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to raise complaint');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="card">
        <h2>Raise a Complaint</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Photo (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
          </div>
          {error && <p className="error-text">{error}</p>}
          {success && <p style={{ color: '#16a34a', fontSize: 13 }}>{success}</p>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
}
