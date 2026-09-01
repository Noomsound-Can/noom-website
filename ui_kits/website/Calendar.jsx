const CALENDAR = [
  { day: '02', month: 'Jul', dow: 'Thu', kind: 'Sound & movement · with Melie',  title: 'Noom & Melie at Mulajoy',      meta: 'Mulajoy Community & Creativity Center, Maret. First Thursday of every month — handpan and song under the trees.', price: 'Free entry · donations welcome', link: 'https://mulajoy.com/', linkLabel: 'Mulajoy Samui' },
  { day: '06', month: 'Aug', dow: 'Thu', kind: 'Sound & movement · with Melie',  title: 'Noom & Melie at Mulajoy',      meta: 'Mulajoy Community & Creativity Center, Maret. First Thursday of every month — handpan and song under the trees.', price: 'Free entry · donations welcome', link: 'https://mulajoy.com/', linkLabel: 'Mulajoy Samui' },
  { day: '03', month: 'Sep', dow: 'Thu', kind: 'Sound & movement · with Melie',  title: 'Noom & Melie at Mulajoy',      meta: 'Mulajoy Community & Creativity Center, Maret. First Thursday of every month — handpan and song under the trees.', price: 'Free entry · donations welcome', link: 'https://mulajoy.com/', linkLabel: 'Mulajoy Samui' },
  { day: '14', month: 'Jul', dow: 'Mon', kind: 'Lessons · one-to-one',  title: 'Private handpan lesson',       meta: 'Studio, sixty minutes. Begin where you are.',                            price: '฿1,800 · by appointment' },
  { day: '17', month: 'Jul', dow: 'Thu', kind: 'Group · sound therapy', title: 'New-moon listening',           meta: 'Studio, seventy-five minutes. Twelve seats. Lie back, let the room work.', price: '฿2,400 · twelve seats' },
  { day: '25', month: 'Jul', dow: 'Fri', kind: 'Free · weekly',         title: 'Sound & movement gathering',  meta: 'Lamai cliffs, 6:30 pm. All welcome.',                                   price: 'Free · simply arrive' }
];

function CalendarRow({ day, month, dow, kind, title, meta, price, link, linkLabel }) {
  const titleStyle = { fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 36, lineHeight: 1.15, color: 'var(--ink)', margin: 0, borderBottom: 0, display: 'inline-block' };
  return (
    <article className="reveal" style={{
      display: 'grid', gridTemplateColumns: '200px 1fr', gap: 64,
      alignItems: 'baseline', padding: '56px 0',
      borderTop: '1px solid var(--ink-faint)'
    }}>
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 96, lineHeight: 0.92, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{day}</div>
        <div className="eyebrow" style={{ marginTop: 14 }}>{month} · {dow}</div>
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 16 }}>{kind}</div>
        {link
          ? <a href={link} target="_blank" rel="noopener noreferrer" style={titleStyle}>{title}</a>
          : <h3 style={titleStyle}>{title}</h3>}
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 19, lineHeight: 1.55, color: 'var(--ink-soft)', margin: '14px 0 0' }}>{meta}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 24, marginTop: 16 }}>
          <span className="eyebrow">{price}</span>
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="eyebrow" style={{ color: 'var(--clay)', borderBottom: '1px solid var(--clay)', paddingBottom: 2 }}>
              {linkLabel || 'Details'} &rarr;
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function Calendar() {
  return (
    <section id="calendar" style={{ padding: 'var(--s-10) var(--gutter) var(--s-9)', maxWidth: 1180, margin: '0 auto' }}>
      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'end', borderTop: '1px solid var(--ink-faint)', paddingTop: 32, marginBottom: 80 }}>
        <div>
          <p className="eyebrow">Upcoming · gatherings &amp; live dates</p>
          <h2 style={{ marginTop: 24, marginBottom: 0 }}>Gatherings, lessons,<br/><em style={{ fontStyle: 'italic', fontWeight: 300 }}>and listening.</em></h2>
        </div>
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 18, lineHeight: 1.6, maxWidth: '36ch', margin: 0 }}>
          The first Thursday of every month, Noom plays with Melie at Mulajoy Samui. Other dates land each Sunday evening; the Friday circle is free — simply arrive.
        </p>
      </div>
      {CALENDAR.map((e, i) => <CalendarRow key={i} {...e} />)}
      <div style={{ borderTop: '1px solid var(--ink-faint)' }} />
    </section>
  );
}
