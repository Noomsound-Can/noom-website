function Footer() {
  return (
    <footer id="write" style={{ padding: 'var(--s-9) var(--gutter) var(--s-7)', background: 'var(--paper)', borderTop: '1px solid var(--ink-faint)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--ink)' }}>Noom</div>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-soft)', marginTop: 12, fontSize: 16, lineHeight: 1.55, maxWidth: '34ch' }}>
            A small handpan studio on the south coast of Koh Samui.
          </p>
        </div>
        <div>
          <p className="eyebrow">Visit</p>
          <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.6 }}>Soi Lamai 4<br/>Koh Samui, 84310<br/>Thailand</p>
        </div>
        <div>
          <p className="eyebrow">Write</p>
          <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.6 }}>noom@noomsoundstudio.com<br/>+66 99 123 4567</p>
        </div>
        <div>
          <p className="eyebrow">Elsewhere</p>
          <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.8 }}>
            <a>Instagram</a><br/>
            <a>Spotify</a><br/>
            <a>Newsletter</a>
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', marginTop: 72, paddingTop: 24, borderTop: '1px solid var(--ink-faint)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
        <span>Made on the island. Held lightly.</span>
        <span>© 2026 Noom Sound Studio</span>
      </div>
    </footer>
  );
}
window.Footer = Footer;
