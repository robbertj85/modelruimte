import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ibm-plex-sans), sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: 32 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>Pagina niet gevonden</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>
          De pagina die u zoekt bestaat niet of is verplaatst.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: '#003366',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          Terug naar de rekentool
        </Link>
      </div>
    </div>
  );
}
