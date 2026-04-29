function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '18px clamp(24px, 4vw, 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(244,236,223,0.78)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--ink-faint)' : '1px solid transparent',
      transition: 'background 500ms var(--ease-slow), border-color 500ms var(--ease-slow)'
    }}>
      <a href="#top" style={{ borderBottom: 0, color: 'var(--ink)' }}>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, letterSpacing: '0.04em' }}>Noom</span>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginLeft: 10 }}>Sound Studio</span>
      </a>
      <div style={{ display: 'flex', gap: 32, fontFamily: 'var(--sans)', fontSize: 13, letterSpacing: '0.04em' }}>
        {['Calendar', 'Sessions', 'About', 'Write'].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} style={{ color: 'var(--ink)', borderBottom: 0 }}>{l}</a>
        ))}
      </div>
    </nav>
  );
}
window.Nav = Nav;
