const TRACKS = [
  { title: 'Sunset, slowly', meta: 'D minor · 3:42 · Lamai, March 2026', dur: '03:42' },
  { title: 'Morning agave', meta: 'F minor · 5:21 · studio garden', dur: '05:21' },
  { title: 'New-moon circle', meta: 'C# minor · 7:08 · live recording', dur: '07:08' }
];

function AudioRow({ title, meta, dur }) {
  const [playing, setPlaying] = React.useState(false);
  return (
    <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '22px 0', borderTop: '1px solid var(--ink-faint)' }}>
      <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'pause' : 'play'} style={{
        width: 48, height: 48, borderRadius: 999, background: 'var(--ink)', color: 'var(--cream)', border: 0,
        display: 'grid', placeItems: 'center', cursor: 'pointer', flex: '0 0 48px'
      }}>
        {playing
          ? <svg width="14" height="14" viewBox="0 0 14 14"><rect x="3" y="2" width="3" height="10" fill="currentColor"/><rect x="8" y="2" width="3" height="10" fill="currentColor"/></svg>
          : <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="3,2 12,7 3,12" fill="currentColor"/></svg>}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--ink-mute)', marginTop: 2 }}>{meta}</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>{dur}</div>
    </div>
  );
}

export function Audio() {
  return (
    <section style={{ padding: 'var(--s-9) var(--gutter)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="reveal" style={{ marginBottom: 32 }}>
          <p className="eyebrow">Listening · a few recordings</p>
          <h2 style={{ marginTop: 24 }}>From the studio.</h2>
        </div>
        <div style={{ borderBottom: '1px solid var(--ink-faint)' }}>
          {TRACKS.map((t, i) => <AudioRow key={i} {...t} />)}
        </div>
      </div>
    </section>
  );
}
