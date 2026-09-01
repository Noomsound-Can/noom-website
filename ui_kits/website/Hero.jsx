export function Hero() {
  return (
    <section id="top" style={{ position: 'relative', minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.3fr 1fr', alignItems: 'stretch' }}>
      <div style={{
        backgroundImage: "url('../../assets/photo-noom-sunset-handpan.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(48px, 8vw, 112px) clamp(32px, 5vw, 72px) clamp(72px, 10vw, 160px)' }}>
        <p className="eyebrow reveal">Koh Samui · Thailand</p>
        <h1 className="display reveal" style={{ marginTop: 24, marginBottom: 24 }}>Sound,<br/><em style={{ fontStyle: 'italic', fontWeight: 300 }}>slowly.</em></h1>
        <p className="lead reveal" style={{ maxWidth: '38ch' }}>
          Handpan lessons and listening sessions on the cliffs of Koh Samui &mdash; held weekly, open to all.
        </p>
        <div className="reveal" style={{ display: 'flex', gap: 16, marginTop: 40 }}>
          <a href="#calendar" style={{
            background: 'var(--ink)', color: 'var(--cream)', borderBottom: 0,
            padding: '14px 22px', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, letterSpacing: '0.04em'
          }}>See the calendar</a>
          <a href="#write" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)', borderBottom: '1px solid var(--ink-faint)', paddingBottom: 4, alignSelf: 'center' }}>
            Write to Noom &nbsp;→
          </a>
        </div>
      </div>
    </section>
  );
}
