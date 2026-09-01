function SessionCard({ kind, title, body, price, duration, primary }) {
  return (
    <div className="reveal" style={{
      border: primary ? '1px solid var(--ink)' : '1px solid var(--ink-faint)',
      padding: 'var(--s-7)',
      background: 'var(--cream)',
      display: 'flex', flexDirection: 'column'
    }}>
      <p className="eyebrow">{kind}</p>
      <h3 style={{ fontSize: 36, fontWeight: 400, marginTop: 18, marginBottom: 14, lineHeight: 1.15 }}>{title}</h3>
      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 18, lineHeight: 1.55, margin: 0 }}>{body}</p>
      <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)' }}>{price} <span style={{ color: 'var(--ink-mute)' }}>· {duration}</span></div>
        <a href="#write" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)', borderBottom: '1px solid var(--ink-faint)', paddingBottom: 2 }}>Reserve &nbsp;→</a>
      </div>
    </div>
  );
}

export function Sessions() {
  return (
    <section id="sessions" style={{ padding: 'var(--s-9) var(--gutter)', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="reveal" style={{ marginBottom: 56 }}>
          <p className="eyebrow">Sessions · year-round, by appointment</p>
          <h2 style={{ marginTop: 24, maxWidth: '18ch' }}>Two ways to spend an afternoon.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <SessionCard kind="Lessons" title="One-to-one handpan" body="Begin where you are. Sixty minutes, by the water. We tune the instrument together first, then play." price="฿1,800" duration="60 min" />
          <SessionCard kind="Sessions" title="Sound therapy" body="Lie back. Listen. Let the room do its work. Handpan, gongs, voice — held in the studio." price="฿2,400" duration="75 min" primary />
        </div>
      </div>
    </section>
  );
}
