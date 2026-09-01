export function Intro() {
  return (
    <section style={{ padding: 'var(--s-10) var(--gutter)', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr' }}>
      <div className="reveal" style={{ gridColumn: 2 }}>
        <p className="eyebrow">A note from Noom</p>
        <p className="lead" style={{ marginTop: 32, fontSize: 28, lineHeight: 1.45 }}>
          We gather at sunset, near the water. The sessions are unhurried. There is space to sit, to listen, and &mdash; if you want &mdash; to play.
        </p>
        <p style={{ marginTop: 32, color: 'var(--ink-soft)' }}>
          Noom Sound Studio is a small practice on the south coast of Koh Samui. Handpan lessons run year-round; sound therapy is by appointment; the Friday gathering is free and open to anyone passing through the island.
        </p>
      </div>
    </section>
  );
}
