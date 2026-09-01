export function About() {
  return (
    <section id="about" style={{ padding: 'var(--s-9) var(--gutter)', background: 'var(--cream-soft)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '5fr 6fr', gap: 'clamp(32px, 6vw, 96px)', alignItems: 'center' }}>
        <div className="reveal" style={{ height: '100%', minHeight: 480, backgroundImage: "url('../../assets/photo-noom-sunset-handpan.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="reveal">
          <p className="eyebrow">About</p>
          <h2 style={{ marginTop: 24, marginBottom: 24 }}>Noom plays a 9-note D minor handpan made in Bern.</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            He arrived on Koh Samui in 2019, set down a cushion under a frangipani tree, and hasn't really stopped since. The studio is a single room on the south coast — open to the garden, candles in the evening, a kettle always on.
          </p>
          <p style={{ color: 'var(--ink-soft)', marginTop: 16 }}>
            Lessons are gentle and unhurried. You don't need to be musical. You need to be willing to listen.
          </p>
          <a href="#write" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 19, color: 'var(--ink)', borderBottom: '1px solid var(--ink-faint)', paddingBottom: 3, marginTop: 32, display: 'inline-block' }}>
            Write to Noom &nbsp;→
          </a>
        </div>
      </div>
    </section>
  );
}
