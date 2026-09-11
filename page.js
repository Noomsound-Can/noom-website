const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navScrim = document.getElementById('navScrim');
if (navToggle && navLinks && navScrim) {
  const closeMenu = () => { nav.classList.remove('menu-open'); navToggle.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); navScrim.classList.remove('show'); };
  const openMenu = () => { nav.classList.add('menu-open'); navToggle.classList.add('open'); navToggle.setAttribute('aria-expanded', 'true'); navScrim.classList.add('show'); };
  navToggle.addEventListener('click', () => nav.classList.contains('menu-open') ? closeMenu() : openMenu());
  navScrim.addEventListener('click', closeMenu);
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}
// Past dates drop off: data-until="YYYY-MM-DD" goes the day after (Koh Samui time), and a
// data-until-list with no date left goes too. The Worker already does this for /schedule/;
// this covers any page it does not rewrite.
(() => {
  const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  document.querySelectorAll('[data-until]').forEach(el => { if (el.dataset.until < today) el.remove(); });
  document.querySelectorAll('[data-until-list]').forEach(el => { if (!el.querySelector('[data-until]')) el.remove(); });
})();
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
const revealAll = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in'));
if (!('IntersectionObserver' in window)) revealAll();
window.addEventListener('load', () => setTimeout(revealAll, 1400));
setTimeout(revealAll, 2600);
