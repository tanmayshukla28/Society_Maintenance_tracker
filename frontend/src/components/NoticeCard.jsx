export default function NoticeCard({ notice }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{notice.title}</strong>
        {notice.isImportant && <span className="badge important">IMPORTANT</span>}
      </div>
      <p style={{ marginTop: 8 }}>{notice.content}</p>
      <div style={{ fontSize: 12, color: '#6b7280' }}>
        Posted by {notice.postedBy?.name || 'Admin'} • {new Date(notice.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
