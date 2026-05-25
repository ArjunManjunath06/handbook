export default function SuccessPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%)',
        padding: '40px 16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
          Payment Successful!
        </h1>
        <p style={{ fontSize: 17, color: '#4b5563', lineHeight: 1.6 }}>
          We&apos;re generating your custom employee handbook now. You&apos;ll receive an email with
          a download link within a few minutes.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 32,
            padding: '12px 24px',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Generate Another Handbook
        </a>
      </div>
    </main>
  )
}
