import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="section">
      <div className="container">
        <h1 className="display-l" style={{ marginBottom: 16 }}>Page not found.</h1>
        <p className="lead" style={{ marginBottom: 24 }}>That page does not exist or has moved.</p>
        <Link className="btn" href="/find-an-agency/">Find an agency</Link>
      </div>
    </div>
  );
}
