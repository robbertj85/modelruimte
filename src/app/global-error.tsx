'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: 32 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>Er is iets misgegaan</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Er is een onverwachte fout opgetreden. Probeer het opnieuw.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                backgroundColor: '#003366',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
