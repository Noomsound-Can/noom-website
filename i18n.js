/* ===================================================================
   Noom Sound Studio — i18n
   - English is the source of truth (already in HTML)
   - On first load, captures EN strings, then overlays per-language map
   - IP-based detection via ipapi.co (free, CORS), with navigator.language
     fallback and persisted choice in localStorage
   - Translations below are a starting point. We recommend a native
     speaker review the TH/DE/FR/RU copy before going live —
     especially the FAQ answers.
   =================================================================== */

(function () {
  'use strict';

  const SUPPORTED = ['en', 'th', 'de', 'fr', 'ru', 'tr', 'he'];
  const RTL_LANGS = ['he'];
  const STORAGE_KEY = 'noom-lang';

  // ----- Country → language mapping (IP-based detection) -----
  const COUNTRY_TO_LANG = {
    // Thai
    TH: 'th',
    // German-speaking
    DE: 'de', AT: 'de', CH: 'de', LI: 'de',
    // French-speaking
    FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr',
    // Russian / CIS (Russian as common 2nd lang)
    RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru', UZ: 'ru', TJ: 'ru', AM: 'ru', AZ: 'ru', MD: 'ru',
    // Turkish
    TR: 'tr',
    // Hebrew
    IL: 'he',
  };

  // ===================================================================
  // TRANSLATIONS
  // Edit any string below and reload — the live language updates.
  // HTML is allowed (use it for <br/>, <em>, <strong> just like the EN source).
  // ===================================================================
  const T = {
    th: {
      'nav.events': 'กิจกรรม',
      'nav.reviews': 'รีวิว',
      'nav.faq': 'คำถาม',
      'nav.contact': 'ติดต่อ',

      'hero.eyebrow': 'เกาะสมุย · ประเทศไทย',
      'hero.title': 'แฮนด์แพน,<br/><em>เล่นด้วยกัน.</em>',
      'hero.sub': 'คลาสแฮนด์แพน, ซาวด์เจอร์นี่, แจมประจำสัปดาห์ และคลาสเคลื่อนไหวบนเกาะสมุย',
      'hero.cta': 'ดูกิจกรรม &nbsp;&rarr;',
      'hero.scroll': 'เลื่อนลง',

      'intro.p1': 'พวกเราเป็นกลุ่มผู้เล่นเสียงและการเคลื่อนไหวบนเกาะสมุย เราสอนแฮนด์แพน จัดซาวด์เจอร์นี่ด้วยเครื่องดนตรีสด แจมเปิด และจัดเซสชันประจำสัปดาห์ — เพราะเราเชื่อว่าสิ่งเหล่านี้ควรเข้าถึงได้สำหรับทุกคน ไม่ใช่แค่คนที่รู้จักมันมาก่อน',
      'intro.p2': 'มาด้วยความอยากรู้ กลับไปด้วยบางสิ่ง',

      'pillars.eyebrow': 'สิ่งที่เราทำ',
      'pillars.title': 'สี่วิธี<br/><em>ที่จะมาเล่น.</em>',
      'pillars.lede': 'เลือกในสิ่งที่เหมาะกับคุณ คลาสนัดล่วงหน้า; แจมและเจอร์นี่มีวันที่กำหนด; เซสชันประจำสัปดาห์เปิดสำหรับทุกคนที่ผ่านมา',

      'pillar1.title': 'คลาสแฮนด์แพน',
      'pillar1.body': '<strong style="font-weight:500;color:var(--ink)">ส่วนตัว.</strong> 1 คน 60 นาที ปรับตามจังหวะของคุณ — สำหรับมือใหม่หรือผู้กลับมาเล่น<br/><br/><strong style="font-weight:500;color:var(--ink)">กลุ่ม.</strong> 2–3 คน 90 นาที เรียนไปด้วยกัน — สำหรับคู่รัก เพื่อน หรือเพื่อนร่วมทาง<br/><br/>ที่ระเบียงเปิดของ Noom Studio ในละไม หรือเราไปที่โรงแรม/วิลล่าของคุณก็ได้',
      'pillar1.cta': 'ทักเพื่อจอง &nbsp;&rarr;',

      'pillar2.title': 'ซาวด์เจอร์นี่',
      'pillar2.body': 'แฮนด์แพนสด ฆ้อง และโบล์ทิเบต/คริสตัล — เล่นในขณะที่คุณนอนพัก ไม่ต้องมีประสบการณ์<br/><br/>เซสชัน<strong style="font-weight:500;color:var(--ink)">ส่วนตัว</strong>ที่สตูดิโอหรือเราไปที่คุณ — ทักเรามาเพื่อจัด<br/><br/><strong style="font-weight:500;color:var(--ink)">เซสชันเปิดประจำสัปดาห์</strong> ทุกวันอาทิตย์ 17:30 ที่ระเบียง Noom Studio ละไม — ที่นั่งจำกัด',
      'pillar2.cta': 'มาร่วมครั้งต่อไป &nbsp;&rarr;',

      'pillar3.title': 'แจม',
      'pillar3.body': 'เพื่อน ๆ มา เครื่องดนตรีออกมา เราเล่น เปิดสำหรับผู้เล่นแฮนด์แพน คนเล่นเพอร์คัสชั่น นักร้อง — ใครก็ตามที่อยากนั่งร่วม มีชา ของว่าง มักจะเล่นยาว',
      'pillar3.cta': 'มาร่วมครั้งต่อไป &nbsp;&rarr;',

      'pillar4.title': 'เซสชันและกิจกรรมประจำสัปดาห์',
      'pillar4.body': 'เราจัดเซสชันสม่ำเสมอเปิดให้ทุกคน — ซาวด์เจอร์นี่ การรวมตัวเคลื่อนไหวและเสียง และแจมเปิด วันและสถานที่เปลี่ยนตามฤดู ติดตามเราเพื่อไม่พลาด บางอย่างฟรี บางอย่างมีค่าใช้จ่ายเล็กน้อย ทุกอย่างเปิดกว้าง',
      'pillar4.cta': 'ดูวันถัดไป &nbsp;&rarr;',

      'events.eyebrow': 'กิจกรรม',
      'events.title': 'เซสชัน แจม<br/><em>และการรวมตัว.</em>',
      'events.lede': 'เปิดสำหรับทุกคนที่ผ่านมา วันและสถานที่เปลี่ยนตามฤดู — ทักมาเพื่อรอข่าวสารครั้งต่อไป',

      'ev1.price': '฿600',
      'ev1.title': 'ซาวด์เจอร์นี่<br/><em>ประจำสัปดาห์.</em>',
      'ev1.desc': 'นอนพักขณะเราเล่นแฮนด์แพน ฆ้อง และโบล์สด หนึ่งชั่วโมงแห่งการพักผ่อน ไม่ต้องมีส่วนร่วม',
      'ev1.when': 'ทุกวันอาทิตย์ · 17:30<br/><em>60 นาที · ระเบียง Noom Studio, ละไม</em>',

      'ev2.title': 'เสียง<br/><em>และการเคลื่อนไหว.</em>',
      'ev2.desc': 'เซสชันกลางแจ้งประจำสัปดาห์ — เครื่องดนตรีสดและการเคลื่อนไหวเบา ๆ คู่กัน เปิดสำหรับทุกคน',
      'ev2.when': 'รายสัปดาห์ · กลางแจ้ง<br/><em>วันและสถานที่ประกาศ</em>',

      'ev3.price': 'ตามใจให้',
      'ev3.title': 'เวิร์กชอป<br/><em>แฮนด์แพน.</em>',
      'ev3.desc': 'เซสชันกลุ่มเหมาะสำหรับมือใหม่ — เสียงแรก รูปแบบง่าย ๆ หนึ่งชั่วโมงเล่นด้วยกัน มีเครื่องดนตรีให้',
      'ev3.when': 'รายเดือน · ละไม<br/><em>ประกาศวัน</em>',

      'ev4.title': 'แจม<br/><em>เปิด.</em>',
      'ev4.desc': 'ตอนเย็นแบบดรอปอินสำหรับนักดนตรีและผู้ฟังที่อยากรู้ นำเครื่องดนตรีมา หรือมาฟังเฉย ๆ',
      'ev4.when': 'วันเปลี่ยน · รอบสมุย<br/><em>ติดตามครั้งถัดไป</em>',

      'common.whenWhere': 'เมื่อไหร่ & ที่ไหน',
      'common.join': 'เข้าร่วม &nbsp;&rarr;',
      'common.messageJoin': 'ทักเพื่อเข้าร่วม &nbsp;&rarr;',
      'common.free': 'ฟรี',

      'faq.eyebrow': 'คำถามที่พบบ่อย',
      'faq.title': 'สิ่งที่คน<br/><em>อยากรู้.</em>',
      'faq.lede': 'คำตอบสำหรับคำถามที่ถูกถามบ่อยที่สุด ถ้าไม่มีคำถามของคุณ ทักเรา — เราจะตอบกลับ',
      'faq1.title': 'เกี่ยวกับ<br/><em>ซาวด์เจอร์นี่.</em>',
      'faq2.title': 'เกี่ยวกับ<br/><em>คลาสแฮนด์แพน.</em>',
      'faq3.title': 'เรื่อง<br/><em>ปฏิบัติ.</em>',
      'faq4.title': 'เกี่ยวกับ Noom<br/><em>Sound Studio.</em>',

      'faq.q.sj1': 'ในเซสชันเกิดอะไรขึ้นจริง ๆ?',
      'faq.a.sj1': 'คุณนอนลงบนเสื่อ ปิดตา และพัก ในขณะที่เราเล่นเครื่องดนตรีสด — แฮนด์แพน ฆ้อง และโบล์ทิเบต/คริสตัล แค่นั้น ไม่ต้องมีส่วนร่วม คนส่วนใหญ่อยู่ระหว่างตื่นและหลับตลอดเวลา',
      'faq.q.sj2': 'ต้องมีประสบการณ์หรือพื้นฐานไหม?',
      'faq.a.sj2': 'ไม่ต้องเลย คุณไม่จำเป็นต้องรู้เรื่องดนตรีหรือซาวด์เวิร์ก ถ้าคุณนอนเงียบ ๆ ได้หนึ่งชั่วโมง คุณก็พร้อม',
      'faq.q.sj3': 'รู้สึกเป็นยังไง?',
      'faq.a.sj3': 'ต่างกันไปทุกคน บางคนรู้สึกผ่อนคลายลึก ๆ บางคนสังเกตว่าจิตเงียบลง บางคนไม่รู้สึกอะไรพิเศษและออกไปด้วยความรู้สึกพักผ่อน ทั้งหมดล้วนเป็นผลที่ดี',
      'faq.q.sj4': 'เหมือนการทำสมาธิไหม?',
      'faq.a.sj4': 'ไม่เชิง คุณไม่ต้องตั้งสมาธิหรือทำตามคำสั่ง เสียงทำงานส่วนใหญ่ — คุณแค่มาและปล่อย',
      'faq.q.sj5': 'หลับได้ไหม?',
      'faq.a.sj5': 'ได้ และหลายคนก็หลับ',
      'faq.q.sj6': 'ควรใส่อะไรและนำอะไรมา?',
      'faq.a.sj6': 'เสื้อผ้าหลวมสบาย เรามีเสื่อให้ นำเสื้อบาง ๆ มาด้วยถ้าหนาวง่าย — การนอนนิ่งหนึ่งชั่วโมงอาจทำให้คุณรู้สึกหนาวกว่าที่คาด',
      'faq.q.sj7': 'ควรกินก่อนไหม?',
      'faq.a.sj7': 'กินเบา ๆ มื้อหนักก่อนเซสชันทำให้ผ่อนคลายยาก',
      'faq.q.sj8': 'มีเหตุผลที่ไม่ควรมาไหม?',
      'faq.a.sj8': 'ถ้าคุณตั้งครรภ์ มีโรคลมชัก เพิ่งผ่าตัด มีปัญหาการได้ยิน หรือไวต่อเสียงมาก — ทักเราก่อน เราจะหาทางที่เหมาะกับคุณ',

      'faq.q.hp1': 'ต้องมีพื้นฐานดนตรีเพื่อเรียนแฮนด์แพนไหม?',
      'faq.a.hp1': 'ไม่ คนส่วนใหญ่ที่มาหาเราไม่เคยเล่นเครื่องดนตรีมาก่อน แฮนด์แพนถูกออกแบบมาให้ทุกอย่างที่คุณเล่นฟังดูดี — ไม่มี "โน้ตผิด" ในความหมายดั้งเดิม',
      'faq.q.hp2': 'เรียนได้เร็วแค่ไหน?',
      'faq.a.hp2': 'คนส่วนใหญ่ออกจากเซสชันแรกพร้อมเล่นรูปแบบง่าย ๆ ที่ฟังเหมือนเพลงได้จริง เป็นหนึ่งในเครื่องดนตรีที่เริ่มต้นได้เร็วที่สุด',
      'faq.q.hp3': 'ส่วนตัวหรือกลุ่ม — แบบไหนดีกว่าสำหรับฉัน?',
      'faq.a.hp3': '<strong>คลาสส่วนตัว</strong> 60 นาที 1 คน โฟกัสเต็มที่ — ดีถ้าอยากเดินตามจังหวะตัวเองหรือมีเป้าหมายเฉพาะ <strong>คลาสกลุ่ม</strong> 90 นาทีสำหรับ 2–3 คน — ดีกว่าถ้ามากับเพื่อน/คู่เดินทาง',
      'faq.q.hp4': 'ต้องมีเครื่องดนตรีของตัวเองไหม?',
      'faq.a.hp4': 'ไม่ เรามีเครื่องให้ใช้ในเซสชัน ถ้ากำลังคิดจะซื้อ เรายินดีให้คำแนะนำ',
      'faq.q.hp5': 'คลาสจัดที่ไหน?',
      'faq.a.hp5': 'ที่ระเบียงเปิดของ Noom Studio ในละไม หรือเราไปที่โรงแรม/วิลล่า/จุดที่คุณเลือกบนเกาะสมุย',
      'faq.q.hp6': 'อยู่สมุยแค่ไม่กี่วัน — เรียนคลาสเดียวคุ้มไหม?',
      'faq.a.hp6': 'คุ้ม คลาสเดียวพอที่จะเรียนพื้นฐานและกลับไปพร้อมสิ่งที่ฝึกต่อได้ แม้ไม่มีเครื่อง',

      'faq.q.pr1': 'จองยังไง?',
      'faq.a.pr1': 'ทักเราที่ WhatsApp หรือ Instagram เราจะหาเวลาที่เหมาะ',
      'faq.q.pr2': 'ราคาเท่าไหร่?',
      'faq.a.pr2': 'ซาวด์เจอร์นี่ที่สตูดิโอเริ่มต้น <strong>2,500 บาทสำหรับ 2 คน</strong> (+500 บาทต่อคนเพิ่ม สูงสุด 6 คน) ไปที่คุณเริ่ม <strong>4,000 บาทสำหรับ 4 คน</strong> (+500 บาทต่อคน สูงสุด 12 คน) เซสชันเปิดวันอาทิตย์ <strong>600 บาทต่อคน</strong> ราคาคลาสแฮนด์แพน — ทักเราเพื่อยืนยัน',
      'faq.q.pr3': 'พาเด็กมาได้ไหม?',
      'faq.a.pr3': 'ได้ ทักเราแล้วเราจะบอกว่าเหมาะอย่างไรตามช่วงอายุ',
      'faq.q.pr4': 'สตูดิโออยู่ในหรือกลางแจ้ง?',
      'faq.a.pr4': 'ระเบียงเปิดในละไม — รายล้อมด้วยต้นไม้และท้องฟ้า',
      'faq.q.pr5': 'ถ้าต้องยกเลิกล่ะ?',
      'faq.a.pr5': 'เรื่องเกิดได้ ทักเราเร็วที่สุดเท่าที่ทำได้ เราจะจัดการให้',

      'faq.q.ab1': 'ใครดูแล Noom Sound Studio?',
      'faq.a.ab1': 'พวกเราเป็นทีมเล็กบนเกาะสมุย <strong>Can (Kazimcan)</strong> นำคลาสแฮนด์แพนและแจม ซาวด์เจอร์นี่ร่วมกับ <strong>House of Holistic by Melie</strong>',
      'faq.q.ab2': 'อยู่ที่ไหน?',
      'faq.a.ab2': 'ละไม ทางใต้ของเกาะสมุย ประเทศไทย',
      'faq.q.ab3': 'ทำงานกับโรงแรม รีทรีต หรือสถานที่ไหม?',
      'faq.a.ab3': 'ใช่ — ทักเราเรื่องอีเวนต์ส่วนตัว เซสชันที่สถานที่ หรือพาร์ทเนอร์ระยะยาว',

      'testimonials.eyebrow': 'สิ่งที่คนพูด',
      'testimonials.title': 'จากผู้ที่มา<br/><em>และเล่น.</em>',
      'testimonials.lede': 'แขก นักเรียน และผู้มาครั้งแรก — คนที่มาโดยไม่รู้ว่าจะเจออะไร',

      't1.quote': 'ฉันไม่รู้ว่าซาวด์เจอร์นี่คืออะไรก่อนมา ออกไปรู้สึกเหมือนนอนมา 10 ชั่วโมง — นิ่งในแบบที่ไม่เคยรู้สึกมาหลายปี ไม่มีอะไรเทียบ',
      't1.detail': 'ลอนดอน, สหราชอาณาจักร · ซาวด์เจอร์นี่',
      't2.quote': 'Can สอนแฮนด์แพนให้เราในวันที่สองที่มาสมุย ครบหนึ่งชั่วโมงเราเล่นเพลงด้วยกันได้จริง ๆ สิ่งที่ดีที่สุดของทริปทั้งหมด',
      't2.detail': 'มิลาน, อิตาลี · คลาสแฮนด์แพน',
      't3.quote': 'ซาวด์เจอร์นี่วันอาทิตย์ที่ระเบียงกลายเป็นพิธีกรรมตลอดที่ฉันพัก ไป 3 สัปดาห์ติด คุ้มที่จะวางแผนทั้งสัปดาห์รอบมัน',
      't3.detail': 'เบอร์ลิน, เยอรมนี · เซสชันรายสัปดาห์',

      'contact.eyebrow': 'ติดต่อ',
      'contact.title': 'ทักเรา<br/><em>ตรง ๆ.</em>',
      'contact.lede': 'สำหรับคลาสส่วนตัว ซาวด์เจอร์นี่ คำเชิญแจม อีเวนต์ หรือความร่วมมือบนเกาะสมุย',
      'contact.whatsapp': 'ทักทาง WhatsApp',
      'contact.instagram': 'เยี่ยม Instagram',
      'contact.findUs': 'หาเรา',
      'contact.address': 'ระเบียงกลางแจ้ง · ละไม ทางใต้ของเกาะสมุย ประเทศไทย',

      'mailing.eyebrow': 'ติดตามข่าวสาร',
      'mailing.title': 'รู้เป็นคนแรกว่า<br/><em>มีอะไร.</em>',
      'mailing.sub': 'เซสชันใหม่ แจมเปิด และการรวมตัว — ส่งตรงถึงอินบ็อกซ์คุณ ไม่มีสแปม แค่วันที่',
      'mailing.placeholder': 'อีเมลของคุณ',
      'mailing.button': 'สมัคร',
      'mailing.success': 'คุณอยู่ในรายชื่อแล้ว — เราจะติดต่อกลับ',
      'mailing.note': 'ไม่มีสแปม ยกเลิกได้ทุกเมื่อ',

      'footer.comeplay': 'มาเล่น.',
    },

    de: {
      'nav.events': 'Programm',
      'nav.reviews': 'Stimmen',
      'nav.faq': 'FAQ',
      'nav.contact': 'Kontakt',

      'hero.eyebrow': 'Koh Samui · Thailand',
      'hero.title': 'Handpan,<br/><em>gemeinsam.</em>',
      'hero.sub': 'Handpan-Unterricht, Klangreisen, wöchentliche Jams und Bewegungssessions auf Koh Samui.',
      'hero.cta': 'Zum Programm &nbsp;&rarr;',
      'hero.scroll': 'Scrollen',

      'intro.p1': 'Wir sind ein Team aus Klang- und Bewegungspraktizierenden auf Koh Samui. Wir unterrichten Handpan, halten Klangreisen mit Live-Instrumenten, veranstalten offene Jams und wöchentliche Sessions — weil wir glauben, dass diese Praxis allen zugänglich sein sollte, nicht nur denen, die sie schon kennen.',
      'intro.p2': 'Komm neugierig, geh mit etwas.',

      'pillars.eyebrow': 'Was wir tun',
      'pillars.title': 'Vier Wege<br/><em>mitzuspielen.</em>',
      'pillars.lede': 'Wähle, was zu dir passt. Unterricht nach Termin; Jams und Klangreisen zu festen Daten; die Wochensession ist offen für alle, die vorbeikommen.',

      'pillar1.title': 'Handpan-Unterricht',
      'pillar1.body': '<strong style="font-weight:500;color:var(--ink)">Privat.</strong> Eine Person, 60 Minuten, in deinem Tempo — für Anfänger oder Rückkehrende.<br/><br/><strong style="font-weight:500;color:var(--ink)">Gruppe.</strong> Zwei bis drei Personen, 90 Minuten, gemeinsam geführt — für Paare, Freunde oder Reisepartner.<br/><br/>Auf der Open-Air-Terrasse des Noom Studio in Lamai, oder wir kommen zu deinem Hotel oder deiner Villa.',
      'pillar1.cta': 'Schreib uns zur Buchung &nbsp;&rarr;',

      'pillar2.title': 'Klangreisen',
      'pillar2.body': 'Live-Handpan, Gong und tibetische/Kristallschalen — gespielt, während du dich zurücklehnst und ruhst. Keine Erfahrung nötig.<br/><br/><strong style="font-weight:500;color:var(--ink)">Private</strong> Sessions im Studio oder bei dir vor Ort — schreib uns.<br/><br/><strong style="font-weight:500;color:var(--ink)">Wöchentliche offene Session</strong> jeden Sonntag um 17:30 auf der Noom-Studio-Terrasse, Lamai — begrenzte Plätze.',
      'pillar2.cta': 'Beim nächsten Mal dabei &nbsp;&rarr;',

      'pillar3.title': 'Jams',
      'pillar3.body': 'Freunde kommen vorbei, die Instrumente kommen raus, wir spielen. Offen für Handpan-Spielende, Percussionists, Sänger — alle, die mitmachen möchten. Tee und Snacks; meist wird es spät.',
      'pillar3.cta': 'Beim nächsten Mal dabei &nbsp;&rarr;',

      'pillar4.title': 'Wöchentliche Sessions & Events',
      'pillar4.body': 'Wir veranstalten regelmäßige Sessions für alle — Klangreisen, Bewegungs- und Klangtreffen, offene Jams. Termine und Orte wechseln mit der Saison; schau wieder vorbei oder folg uns. Manches ist kostenlos. Manches auf Spendenbasis. Alles offen.',
      'pillar4.cta': 'Nächste Termine ansehen &nbsp;&rarr;',

      'events.eyebrow': 'Programm',
      'events.title': 'Sessions, Jams<br/><em>& Treffen.</em>',
      'events.lede': 'Offen für alle, die vorbeikommen. Termine und Orte wechseln mit der Saison — schreib uns, um für das nächste Mal auf der Liste zu stehen.',

      'ev1.price': '฿600',
      'ev1.title': 'Wöchentliche<br/><em>Klangreise.</em>',
      'ev1.desc': 'Lehn dich zurück, während wir Handpan, Gong und Schalen live spielen. Eine Stunde Ruhe, ohne mitzumachen.',
      'ev1.when': 'Jeden Sonntag · 17:30<br/><em>60 Min. · Noom-Studio-Terrasse, Lamai</em>',

      'ev2.title': 'Klang<br/><em>& Bewegung.</em>',
      'ev2.desc': 'Wöchentliche Outdoor-Session — Live-Instrumente und sanfte Bewegung, Seite an Seite. Offen für alle.',
      'ev2.when': 'Wöchentlich · draußen<br/><em>Tag & Ort werden angekündigt</em>',

      'ev3.price': 'Auf Spendenbasis',
      'ev3.title': 'Handpan-<br/><em>Workshop.</em>',
      'ev3.desc': 'Anfängerfreundliche Gruppensession — erste Klänge, einfache Muster, eine Stunde gemeinsam spielen. Instrumente werden gestellt.',
      'ev3.when': 'Monatlich · Lamai<br/><em>Termine werden angekündigt</em>',

      'ev4.title': 'Offener<br/><em>Jam.</em>',
      'ev4.desc': 'Drop-in-Abend für Musiker und neugierige Zuhörer. Bring ein Instrument mit oder komm einfach zuhören.',
      'ev4.when': 'Wechselnde Termine · auf Samui<br/><em>Folg uns für das nächste Mal</em>',

      'common.whenWhere': 'Wann & wo',
      'common.join': 'Mitmachen &nbsp;&rarr;',
      'common.messageJoin': 'Schreib uns zum Mitmachen &nbsp;&rarr;',
      'common.free': 'Gratis',

      'faq.eyebrow': 'Häufige Fragen',
      'faq.title': 'Was Leute<br/><em>wissen wollen.</em>',
      'faq.lede': 'Praktische Antworten auf die häufigsten Fragen. Ist deine nicht dabei, schreib uns — wir antworten.',
      'faq1.title': 'Über<br/><em>Klangreisen.</em>',
      'faq2.title': 'Über<br/><em>Handpan-Unterricht.</em>',
      'faq3.title': 'Praktisches<br/><em>Drumherum.</em>',
      'faq4.title': 'Über Noom<br/><em>Sound Studio.</em>',

      'faq.q.sj1': 'Was passiert in einer Session?',
      'faq.a.sj1': 'Du legst dich auf eine Matte, schließt die Augen und ruhst, während wir live spielen — Handpan, Gong und tibetische/Kristallschalen. Das ist alles. Du musst nichts tun. Die meisten Menschen treiben zwischen Wachsein und Schlaf.',
      'faq.q.sj2': 'Brauche ich Erfahrung oder Vorwissen?',
      'faq.a.sj2': 'Überhaupt nicht. Du musst nichts über Musik oder Klangarbeit wissen. Wenn du eine Stunde lang still liegen kannst, bist du bereit.',
      'faq.q.sj3': 'Wie fühlt es sich an?',
      'faq.a.sj3': 'Bei jedem anders. Manche fühlen sich tief entspannt. Manche bemerken, wie der Kopf ruhig wird. Manche spüren nichts Besonderes und gehen einfach erholt. Alles davon ist in Ordnung.',
      'faq.q.sj4': 'Ist das wie Meditation?',
      'faq.a.sj4': 'Nicht ganz. Du musst dich nicht konzentrieren oder Anweisungen folgen. Der Klang macht das meiste — du kommst einfach und lässt zu.',
      'faq.q.sj5': 'Darf ich einschlafen?',
      'faq.a.sj5': 'Ja, viele tun es.',
      'faq.q.sj6': 'Was soll ich anziehen und mitbringen?',
      'faq.a.sj6': 'Lockere, bequeme Kleidung. Matten haben wir. Bring eine leichte Decke mit, wenn du leicht frierst — eine Stunde stillliegen kann kühler werden als erwartet.',
      'faq.q.sj7': 'Soll ich vorher essen?',
      'faq.a.sj7': 'Iss leicht. Eine schwere Mahlzeit direkt davor macht das Entspannen schwerer.',
      'faq.q.sj8': 'Gibt es Gründe, nicht zu kommen?',
      'faq.a.sj8': 'Wenn du schwanger bist, Epilepsie hast, eine kürzliche OP, eine Hörerkrankung oder ausgeprägte Geräuschempfindlichkeit — schreib uns zuerst, wir finden eine Lösung.',

      'faq.q.hp1': 'Brauche ich musikalische Erfahrung, um Handpan zu lernen?',
      'faq.a.hp1': 'Nein. Die meisten, die zu uns kommen, haben nie ein Instrument gespielt. Die Handpan ist so gebaut, dass fast alles, was du spielst, gut klingt — es gibt im klassischen Sinn keine falschen Töne.',
      'faq.q.hp2': 'Wie schnell lerne ich?',
      'faq.a.hp2': 'Die meisten gehen aus ihrer ersten Stunde mit einfachen Mustern, die wirklich nach Musik klingen. Es ist eines der am schnellsten zugänglichen Instrumente.',
      'faq.q.hp3': 'Privat oder Gruppe — was passt zu mir?',
      'faq.a.hp3': '<strong>Privatstunden</strong> dauern 60 Minuten, eine Person, volle Aufmerksamkeit — gut, wenn du im eigenen Tempo arbeiten oder konkrete Ziele verfolgen willst. <strong>Gruppenstunden</strong> dauern 90 Minuten für 2–3 Leute — besser, wenn du mit Freunden oder Reisepartnern eine gemeinsame Erfahrung möchtest.',
      'faq.q.hp4': 'Brauche ich ein eigenes Instrument?',
      'faq.a.hp4': 'Nein. Wir haben Instrumente, auf denen du in der Stunde spielen kannst. Wenn du über einen Kauf nachdenkst, beraten wir dich gerne.',
      'faq.q.hp5': 'Wo findet der Unterricht statt?',
      'faq.a.hp5': 'Auf der Open-Air-Terrasse des Noom Studio in Lamai, oder wir kommen zu deinem Hotel, deiner Villa oder einem gewünschten Ort auf Samui.',
      'faq.q.hp6': 'Ich bin nur ein paar Tage auf Samui — lohnt sich eine einzige Stunde?',
      'faq.a.hp6': 'Ja. Eine einzelne Session reicht, um die Grundlagen zu lernen und mit etwas wegzugehen, das du auch ohne Instrument weiter üben kannst.',

      'faq.q.pr1': 'Wie buche ich?',
      'faq.a.pr1': 'Schreib uns auf WhatsApp oder Instagram. Wir finden einen passenden Termin.',
      'faq.q.pr2': 'Was kostet es?',
      'faq.a.pr2': 'Klangreisen im Studio starten bei <strong>2.500 THB für zwei Personen</strong> (+500 THB pro weiterem Gast, max. 6). Bei dir vor Ort ab <strong>4.000 THB für vier Gäste</strong> (+500 THB pro Person, max. 12). Die offenen Sonntag-Sessions kosten <strong>600 THB pro Person</strong>. Preise für Handpan-Unterricht — schreib uns zur Bestätigung.',
      'faq.q.pr3': 'Kann ich Kinder mitbringen?',
      'faq.a.pr3': 'Ja, schreib uns kurz, je nach Alter passen wir das an.',
      'faq.q.pr4': 'Drinnen oder draußen?',
      'faq.a.pr4': 'Open-Air-Terrasse in Lamai — umgeben von Bäumen, offener Himmel.',
      'faq.q.pr5': 'Was, wenn ich absagen muss?',
      'faq.a.pr5': 'Passiert. Schreib uns so früh wie möglich, wir finden eine Lösung.',

      'faq.q.ab1': 'Wer steckt hinter Noom Sound Studio?',
      'faq.a.ab1': 'Wir sind ein kleines Team auf Koh Samui. <strong>Can (Kazimcan)</strong> leitet Handpan-Unterricht und Jams. Klangreisen entstehen in Zusammenarbeit mit <strong>House of Holistic by Melie</strong>.',
      'faq.q.ab2': 'Wo seid ihr ansässig?',
      'faq.a.ab2': 'Lamai, an der Südküste von Koh Samui, Thailand.',
      'faq.q.ab3': 'Arbeitet ihr mit Hotels, Retreats oder Veranstaltungsorten?',
      'faq.a.ab3': 'Ja — schreib uns wegen privater Events, Sessions vor Ort oder laufender Kooperationen.',

      'testimonials.eyebrow': 'Stimmen',
      'testimonials.title': 'Von denen, die<br/><em>kamen & spielten.</em>',
      'testimonials.lede': 'Gäste, Schüler und Erstbesucher — Menschen, die kamen, ohne genau zu wissen, was sie erwartet.',

      't1.quote': 'Ich hatte vorher keine Ahnung, was eine Klangreise ist. Ich ging mit dem Gefühl, zehn Stunden geschlafen zu haben — eine Stille, die ich seit Jahren nicht gespürt hatte. Nichts Vergleichbares.',
      't1.detail': 'London, UK · Klangreise',
      't2.quote': 'Can gab uns am zweiten Tag auf Samui eine Handpan-Stunde. Am Ende der Stunde haben wir tatsächlich zusammen Musik gemacht. Das Beste der ganzen Reise.',
      't2.detail': 'Mailand, Italien · Handpan-Unterricht',
      't3.quote': 'Die Sonntags-Klangreise auf der Terrasse wurde zum Ritual meines Aufenthalts. Drei Wochen in Folge. Es lohnt sich, die Woche darum zu planen.',
      't3.detail': 'Berlin, Deutschland · Wochensession',

      'contact.eyebrow': 'Kontakt',
      'contact.title': 'Schreib uns<br/><em>direkt.</em>',
      'contact.lede': 'Für Privatstunden, Klangreisen, Jam-Einladungen, Events oder Kooperationen auf Koh Samui.',
      'contact.whatsapp': 'Auf WhatsApp schreiben',
      'contact.instagram': 'Zu Instagram',
      'contact.findUs': 'So findest du uns',
      'contact.address': 'Open-Air-Terrasse · Lamai, Südküste Koh Samui, Thailand',

      'mailing.eyebrow': 'Bleib auf dem Laufenden',
      'mailing.title': 'Erfahre als Erste:r,<br/><em>was läuft.</em>',
      'mailing.sub': 'Neue Sessions, offene Jams und Treffen — direkt in dein Postfach. Kein Rauschen, nur Termine.',
      'mailing.placeholder': 'Deine E-Mail-Adresse',
      'mailing.button': 'Eintragen',
      'mailing.success': 'Du bist auf der Liste — wir melden uns.',
      'mailing.note': 'Kein Spam. Jederzeit abbestellbar.',

      'footer.comeplay': 'Komm spielen.',
    },

    fr: {
      'nav.events': 'À l’affiche',
      'nav.reviews': 'Avis',
      'nav.faq': 'FAQ',
      'nav.contact': 'Contact',

      'hero.eyebrow': 'Koh Samui · Thaïlande',
      'hero.title': 'Handpan,<br/><em>ensemble.</em>',
      'hero.sub': 'Cours de handpan, voyages sonores, jams hebdomadaires et sessions de mouvement à Koh Samui.',
      'hero.cta': 'Voir le programme &nbsp;&rarr;',
      'hero.scroll': 'Faire défiler',

      'intro.p1': 'Nous sommes une équipe de praticiens du son et du mouvement basés à Koh Samui. Nous enseignons le handpan, animons des voyages sonores avec instruments live, organisons des jams ouverts et tenons des sessions hebdomadaires — parce que nous croyons que cette pratique devrait être accessible à tous, pas seulement à ceux qui la connaissent déjà.',
      'intro.p2': 'Viens curieux, repars avec quelque chose.',

      'pillars.eyebrow': 'Ce que nous faisons',
      'pillars.title': 'Quatre façons<br/><em>de venir jouer.</em>',
      'pillars.lede': 'Choisis ce qui te convient. Les cours sont sur rendez-vous ; jams et voyages sonores ont des dates fixes ; la session hebdomadaire est ouverte à toute personne de passage.',

      'pillar1.title': 'Cours de handpan',
      'pillar1.body': '<strong style="font-weight:500;color:var(--ink)">Privé.</strong> Un élève, 60 minutes, à ton rythme — pour débutants ou pour reprendre.<br/><br/><strong style="font-weight:500;color:var(--ink)">En groupe.</strong> Deux à trois personnes, 90 minutes, guidées ensemble — pour couples, amis ou compagnons de voyage.<br/><br/>Sur la terrasse en plein air du Noom Studio à Lamai, ou nous venons à ton hôtel ou ta villa.',
      'pillar1.cta': 'Écris-nous pour réserver &nbsp;&rarr;',

      'pillar2.title': 'Voyages sonores',
      'pillar2.body': 'Handpan live, gong et bols tibétains/cristal — joués pendant que tu t’allonges et te reposes. Aucune expérience nécessaire.<br/><br/>Sessions <strong style="font-weight:500;color:var(--ink)">privées</strong> au studio ou chez toi — écris-nous pour organiser.<br/><br/><strong style="font-weight:500;color:var(--ink)">Session ouverte hebdomadaire</strong> chaque dimanche à 17h30 sur la terrasse Noom Studio, Lamai — places limitées.',
      'pillar2.cta': 'Rejoindre la prochaine &nbsp;&rarr;',

      'pillar3.title': 'Jams',
      'pillar3.body': 'Des amis passent, les instruments sortent, on joue. Ouvert aux joueurs de handpan, percussionnistes, chanteurs — à tous ceux qui veulent participer. Thé et en-cas ; ça finit souvent tard.',
      'pillar3.cta': 'Rejoindre la prochaine &nbsp;&rarr;',

      'pillar4.title': 'Sessions & événements hebdomadaires',
      'pillar4.body': 'Nous tenons des sessions régulières ouvertes à tous — voyages sonores, rencontres mouvement et son, jams ouverts. Dates et lieux changent avec la saison ; reviens ou suis-nous pour ne rien manquer. Certains gratuits. D’autres à participation libre. Tout est ouvert.',
      'pillar4.cta': 'Voir les prochaines dates &nbsp;&rarr;',

      'events.eyebrow': 'À l’affiche',
      'events.title': 'Sessions, jams<br/><em>& rassemblements.</em>',
      'events.lede': 'Ouvert à toute personne de passage. Dates et lieux changent avec la saison — écris-nous pour figurer sur la liste de la prochaine.',

      'ev1.price': '฿600',
      'ev1.title': 'Voyage sonore<br/><em>hebdomadaire.</em>',
      'ev1.desc': 'Allonge-toi pendant que nous jouons handpan, gong et bols en live. Une heure de repos, sans participation.',
      'ev1.when': 'Tous les dimanches · 17h30<br/><em>60 min · Terrasse Noom Studio, Lamai</em>',

      'ev2.title': 'Son<br/><em>& mouvement.</em>',
      'ev2.desc': 'Session hebdomadaire en extérieur — instruments live et mouvement doux, côte à côte. Ouvert à tous.',
      'ev2.when': 'Hebdomadaire · en extérieur<br/><em>Jour & lieu annoncés</em>',

      'ev3.price': 'Participation libre',
      'ev3.title': 'Atelier<br/><em>handpan.</em>',
      'ev3.desc': 'Session de groupe pour débutants — premiers sons, motifs simples, une heure de jeu commun. Instruments fournis.',
      'ev3.when': 'Mensuel · Lamai<br/><em>Dates annoncées</em>',

      'ev4.title': 'Jam<br/><em>ouvert.</em>',
      'ev4.desc': 'Soirée libre pour musiciens et auditeurs curieux. Apporte un instrument, ou viens juste écouter.',
      'ev4.when': 'Dates variables · à Samui<br/><em>Suis-nous pour la prochaine</em>',

      'common.whenWhere': 'Quand & où',
      'common.join': 'Rejoindre &nbsp;&rarr;',
      'common.messageJoin': 'Écris-nous pour rejoindre &nbsp;&rarr;',
      'common.free': 'Gratuit',

      'faq.eyebrow': 'Questions fréquentes',
      'faq.title': 'Ce que les gens<br/><em>veulent savoir.</em>',
      'faq.lede': 'Des réponses concrètes aux questions les plus posées. Si la tienne n’y est pas, écris-nous — on te répond.',
      'faq1.title': 'Sur les<br/><em>voyages sonores.</em>',
      'faq2.title': 'Sur les<br/><em>cours de handpan.</em>',
      'faq3.title': 'Côté<br/><em>pratique.</em>',
      'faq4.title': 'À propos de Noom<br/><em>Sound Studio.</em>',

      'faq.q.sj1': 'Que se passe-t-il vraiment pendant une session ?',
      'faq.a.sj1': 'Tu t’allonges sur un tapis, fermes les yeux et te reposes pendant que nous jouons en live — handpan, gong, bols tibétains et cristal. C’est tout. Aucune participation requise. La plupart des gens flottent entre l’éveil et le sommeil pendant toute la durée.',
      'faq.q.sj2': 'Faut-il de l’expérience ?',
      'faq.a.sj2': 'Aucune. Tu n’as pas besoin de connaître la musique ou la pratique du son. Si tu peux rester allongé une heure, tu es prêt.',
      'faq.q.sj3': 'Qu’est-ce que ça fait ?',
      'faq.a.sj3': 'Différent pour chacun. Certains se sentent profondément détendus. D’autres remarquent leur mental qui se calme. D’autres encore ne sentent rien d’inhabituel et repartent simplement reposés. Tous ces résultats sont bons.',
      'faq.q.sj4': 'Est-ce comme de la méditation ?',
      'faq.a.sj4': 'Pas vraiment. Tu n’as pas à te concentrer ou suivre des instructions. Le son fait l’essentiel — il te suffit d’être là et de laisser faire.',
      'faq.q.sj5': 'Puis-je m’endormir ?',
      'faq.a.sj5': 'Oui, et beaucoup le font.',
      'faq.q.sj6': 'Que porter et apporter ?',
      'faq.a.sj6': 'Des vêtements amples et confortables. Les tapis sont fournis. Apporte une couche légère si tu as facilement froid — rester immobile une heure peut refroidir plus qu’on ne le pense.',
      'faq.q.sj7': 'Faut-il manger avant ?',
      'faq.a.sj7': 'Mange léger. Un repas copieux juste avant rend la détente plus difficile.',
      'faq.q.sj8': 'Y a-t-il des raisons de ne pas venir ?',
      'faq.a.sj8': 'Si tu es enceinte, épileptique, en convalescence après une opération, sujette à un trouble auditif ou très sensible aux sons — écris-nous d’abord, on trouvera ce qui te convient.',

      'faq.q.hp1': 'Faut-il avoir de l’expérience musicale pour apprendre le handpan ?',
      'faq.a.hp1': 'Non. La plupart des gens qui viennent n’ont jamais joué d’instrument. Le handpan est conçu pour que presque tout ce que tu joues sonne bien — il n’y a pas de fausses notes au sens traditionnel.',
      'faq.q.hp2': 'À quelle vitesse peut-on apprendre ?',
      'faq.a.hp2': 'La plupart repartent de leur première séance en jouant des motifs simples qui ressemblent à de la musique. C’est l’un des instruments les plus rapides à aborder.',
      'faq.q.hp3': 'Privé ou groupe — lequel choisir ?',
      'faq.a.hp3': '<strong>Les cours privés</strong> durent 60 minutes, un élève, attention totale — idéal pour avancer à ton rythme ou avec un objectif précis. <strong>Les cours en groupe</strong> durent 90 minutes pour 2 à 3 personnes — mieux si tu viens avec un proche et veux vivre l’expérience à plusieurs.',
      'faq.q.hp4': 'Faut-il mon propre instrument ?',
      'faq.a.hp4': 'Non. Nous fournissons les instruments pendant la séance. Si tu envisages d’en acheter un, on peut t’aider à choisir.',
      'faq.q.hp5': 'Où ont lieu les cours ?',
      'faq.a.hp5': 'Sur la terrasse en plein air du Noom Studio à Lamai, ou nous venons à ton hôtel, ta villa ou un lieu choisi sur Samui.',
      'faq.q.hp6': 'Je ne suis à Samui que quelques jours — un seul cours en vaut-il la peine ?',
      'faq.a.hp6': 'Oui. Une séance suffit pour apprendre les bases et repartir avec de quoi continuer à pratiquer, même sans instrument.',

      'faq.q.pr1': 'Comment réserver ?',
      'faq.a.pr1': 'Écris-nous sur WhatsApp ou Instagram. Nous trouverons un horaire.',
      'faq.q.pr2': 'Combien ça coûte ?',
      'faq.a.pr2': 'Voyages sonores au studio à partir de <strong>2 500 THB pour deux personnes</strong> (+500 THB par invité supplémentaire, max. 6). Chez toi à partir de <strong>4 000 THB pour quatre invités</strong> (+500 THB par personne, max. 12). Sessions ouvertes du dimanche à <strong>600 THB par personne</strong>. Tarifs des cours de handpan — écris-nous pour confirmation.',
      'faq.q.pr3': 'Puis-je venir avec des enfants ?',
      'faq.a.pr3': 'Oui, écris-nous et on te dira ce qui convient selon l’âge.',
      'faq.q.pr4': 'Le studio est-il intérieur ou extérieur ?',
      'faq.a.pr4': 'Terrasse en plein air à Lamai — entourée d’arbres, ciel ouvert.',
      'faq.q.pr5': 'Et si je dois annuler ?',
      'faq.a.pr5': 'La vie arrive. Préviens-nous le plus tôt possible et on s’arrange.',

      'faq.q.ab1': 'Qui est derrière Noom Sound Studio ?',
      'faq.a.ab1': 'Une petite équipe basée à Koh Samui. <strong>Can (Kazimcan)</strong> mène les cours de handpan et les jams. Les voyages sonores sont organisés en collaboration avec <strong>House of Holistic by Melie</strong>.',
      'faq.q.ab2': 'Où êtes-vous basés ?',
      'faq.a.ab2': 'Lamai, côte sud de Koh Samui, Thaïlande.',
      'faq.q.ab3': 'Travaillez-vous avec des hôtels, retraites ou lieux ?',
      'faq.a.ab3': 'Oui — écris-nous pour des événements privés, sessions sur place ou partenariats réguliers.',

      'testimonials.eyebrow': 'Ce qu’on en dit',
      'testimonials.title': 'De ceux qui sont<br/><em>venus & ont joué.</em>',
      'testimonials.lede': 'Invités, élèves, première fois — des gens venus sans trop savoir à quoi s’attendre.',

      't1.quote': 'Je ne savais pas ce qu’était un voyage sonore avant d’y aller. Je suis repartie avec l’impression d’avoir dormi dix heures — un calme que je n’avais pas ressenti depuis des années. Rien de comparable.',
      't1.detail': 'Londres, R.-U. · Voyage sonore',
      't2.quote': 'Can nous a donné un cours de handpan le deuxième jour à Samui. Au bout d’une heure, on jouait vraiment de la musique ensemble. Le meilleur moment du voyage.',
      't2.detail': 'Milan, Italie · Cours de handpan',
      't3.quote': 'Le voyage sonore du dimanche sur la terrasse est devenu un rituel pendant mon séjour. Trois semaines d’affilée. Ça vaut le coup d’organiser sa semaine autour.',
      't3.detail': 'Berlin, Allemagne · Session hebdomadaire',

      'contact.eyebrow': 'Contact',
      'contact.title': 'Écris-nous<br/><em>directement.</em>',
      'contact.lede': 'Pour cours privés, voyages sonores, invitations aux jams, événements ou collaborations à Koh Samui.',
      'contact.whatsapp': 'Écrire sur WhatsApp',
      'contact.instagram': 'Voir Instagram',
      'contact.findUs': 'Nous trouver',
      'contact.address': 'Terrasse en plein air · Lamai, côte sud de Koh Samui, Thaïlande',

      'mailing.eyebrow': 'Reste informé',
      'mailing.title': 'Sois le premier<br/><em>à savoir.</em>',
      'mailing.sub': 'Nouvelles sessions, jams ouverts et rassemblements — directement dans ta boîte. Pas de bruit, juste des dates.',
      'mailing.placeholder': 'Ton adresse e-mail',
      'mailing.button': 'S’inscrire',
      'mailing.success': 'Tu es sur la liste — à très vite.',
      'mailing.note': 'Pas de spam. Désinscription à tout moment.',

      'footer.comeplay': 'Viens jouer.',
    },

    ru: {
      'nav.events': 'Расписание',
      'nav.reviews': 'Отзывы',
      'nav.faq': 'Вопросы',
      'nav.contact': 'Контакты',

      'hero.eyebrow': 'Ко Самуи · Таиланд',
      'hero.title': 'Хэндпан,<br/><em>играем вместе.</em>',
      'hero.sub': 'Уроки хэндпана, звуковые путешествия, еженедельные джемы и сессии движения на Ко Самуи.',
      'hero.cta': 'Расписание &nbsp;&rarr;',
      'hero.scroll': 'Прокрутка',

      'intro.p1': 'Мы — команда практиков звука и движения на Ко Самуи. Учим играть на хэндпане, проводим звуковые путешествия с живыми инструментами, организуем открытые джемы и еженедельные сессии — потому что верим, что такая практика должна быть доступна всем, а не только тем, кто уже о ней знает.',
      'intro.p2': 'Приходи с любопытством, уноси что-то с собой.',

      'pillars.eyebrow': 'Чем мы занимаемся',
      'pillars.title': 'Четыре способа<br/><em>прийти и играть.</em>',
      'pillars.lede': 'Выбирай то, что подходит. Уроки — по записи; джемы и путешествия — по фиксированным датам; еженедельная сессия открыта для всех, кто проходит мимо.',

      'pillar1.title': 'Уроки хэндпана',
      'pillar1.body': '<strong style="font-weight:500;color:var(--ink)">Индивидуально.</strong> Один ученик, 60 минут, в твоём темпе — для новичков и тех, кто возвращается.<br/><br/><strong style="font-weight:500;color:var(--ink)">В группе.</strong> Два-три человека, 90 минут, ведём вместе — для пар, друзей или попутчиков.<br/><br/>На открытой террасе Noom Studio в Ламае или мы приедем к вам в отель или виллу.',
      'pillar1.cta': 'Написать и записаться &nbsp;&rarr;',

      'pillar2.title': 'Звуковые путешествия',
      'pillar2.body': 'Живой хэндпан, гонг и тибетские/кристаллические чаши — играем, пока вы лежите и отдыхаете. Опыт не нужен.<br/><br/><strong style="font-weight:500;color:var(--ink)">Частные</strong> сессии в студии или мы приедем к вам — напишите, чтобы согласовать.<br/><br/><strong style="font-weight:500;color:var(--ink)">Еженедельная открытая сессия</strong> каждое воскресенье в 17:30 на террасе Noom Studio, Ламай — мест немного.',
      'pillar2.cta': 'Прийти в следующий раз &nbsp;&rarr;',

      'pillar3.title': 'Джемы',
      'pillar3.body': 'Приезжают друзья, достаём инструменты, играем. Открыто для хэндпанистов, перкуссионистов, вокалистов — для всех, кто хочет присоединиться. Чай и закуски; обычно до поздна.',
      'pillar3.cta': 'Прийти в следующий раз &nbsp;&rarr;',

      'pillar4.title': 'Еженедельные сессии и события',
      'pillar4.body': 'Мы регулярно проводим сессии, открытые для всех — звуковые путешествия, встречи звука и движения, открытые джемы. Даты и места меняются по сезону, заглядывайте или подписывайтесь, чтобы быть в курсе. Что-то бесплатно. Что-то — за добровольный взнос. Всё открыто.',
      'pillar4.cta': 'Посмотреть ближайшие даты &nbsp;&rarr;',

      'events.eyebrow': 'Расписание',
      'events.title': 'Сессии, джемы<br/><em>и встречи.</em>',
      'events.lede': 'Открыто для всех, кто проходит мимо. Даты и места меняются по сезону — напишите, чтобы попасть в список на следующее событие.',

      'ev1.price': '฿600',
      'ev1.title': 'Еженедельное<br/><em>звуковое путешествие.</em>',
      'ev1.desc': 'Ложитесь, пока мы играем хэндпан, гонг и чаши вживую. Час покоя, без участия.',
      'ev1.when': 'Каждое воскресенье · 17:30<br/><em>60 мин · терраса Noom Studio, Ламай</em>',

      'ev2.title': 'Звук<br/><em>и движение.</em>',
      'ev2.desc': 'Еженедельная сессия на открытом воздухе — живые инструменты и мягкое движение рядом. Открыто для всех.',
      'ev2.when': 'Еженедельно · на открытом воздухе<br/><em>День и место — анонс</em>',

      'ev3.price': 'Добровольный взнос',
      'ev3.title': 'Мастер-класс<br/><em>хэндпан.</em>',
      'ev3.desc': 'Групповая сессия для новичков — первые звуки, простые ритмы, час игры вместе. Инструменты предоставляем.',
      'ev3.when': 'Раз в месяц · Ламай<br/><em>Даты — анонс</em>',

      'ev4.title': 'Открытый<br/><em>джем.</em>',
      'ev4.desc': 'Вечер «приходи как есть» для музыкантов и любопытных слушателей. Принеси инструмент или просто послушай.',
      'ev4.when': 'Даты разные · по Самуи<br/><em>Следите за анонсами</em>',

      'common.whenWhere': 'Когда и где',
      'common.join': 'Присоединиться &nbsp;&rarr;',
      'common.messageJoin': 'Написать, чтобы прийти &nbsp;&rarr;',
      'common.free': 'Бесплатно',

      'faq.eyebrow': 'Частые вопросы',
      'faq.title': 'Что обычно<br/><em>спрашивают.</em>',
      'faq.lede': 'Практичные ответы на самые частые вопросы. Если вашего нет — напишите, мы ответим.',
      'faq1.title': 'О звуковых<br/><em>путешествиях.</em>',
      'faq2.title': 'Об уроках<br/><em>хэндпана.</em>',
      'faq3.title': 'Практические<br/><em>детали.</em>',
      'faq4.title': 'О Noom<br/><em>Sound Studio.</em>',

      'faq.q.sj1': 'Что происходит на сессии?',
      'faq.a.sj1': 'Вы ложитесь на коврик, закрываете глаза и отдыхаете, пока мы играем вживую — хэндпан, гонг, тибетские и кристаллические чаши. Вот и всё. Участия не нужно. Большинство людей всю сессию находятся где-то между бодрствованием и сном.',
      'faq.q.sj2': 'Нужен ли опыт или подготовка?',
      'faq.a.sj2': 'Нет. Не нужно ничего знать о музыке или звуковых практиках. Если вы можете спокойно лежать час, вы готовы.',
      'faq.q.sj3': 'На что это похоже?',
      'faq.a.sj3': 'У каждого по-разному. Кто-то ощущает глубокое расслабление. Кто-то замечает, как ум успокаивается. Кто-то не чувствует ничего особенного и просто уходит отдохнувшим. Любой результат — нормальный.',
      'faq.q.sj4': 'Это как медитация?',
      'faq.a.sj4': 'Не совсем. Не нужно концентрироваться или следовать инструкциям. Звук делает большую часть работы — вы просто приходите и позволяете.',
      'faq.q.sj5': 'Можно уснуть?',
      'faq.a.sj5': 'Да, и многие засыпают.',
      'faq.q.sj6': 'Что надеть и взять с собой?',
      'faq.a.sj6': 'Свободную, удобную одежду. Коврики у нас есть. Возьмите лёгкий слой, если быстро мёрзнете — за час неподвижного лежания становится прохладнее, чем кажется.',
      'faq.q.sj7': 'Стоит ли есть до сессии?',
      'faq.a.sj7': 'Поешьте легко. Плотная еда непосредственно перед мешает расслабиться.',
      'faq.q.sj8': 'Когда лучше не приходить?',
      'faq.a.sj8': 'Если вы беременны, страдаете эпилепсией, недавно перенесли операцию, есть проблемы со слухом или повышенная звуковая чувствительность — напишите нам сначала, мы подберём подходящий вариант.',

      'faq.q.hp1': 'Нужен ли музыкальный опыт, чтобы учиться играть на хэндпане?',
      'faq.a.hp1': 'Нет. Большинство пришедших к нам никогда не играли на инструментах. Хэндпан устроен так, что почти всё, что вы играете, звучит хорошо — «неправильных» нот в привычном смысле нет.',
      'faq.q.hp2': 'Как быстро можно научиться?',
      'faq.a.hp2': 'Большинство уходит с первого занятия, уже играя простые рисунки, похожие на музыку. Это один из самых быстрых для старта инструментов.',
      'faq.q.hp3': 'Индивидуально или в группе — что лучше?',
      'faq.a.hp3': '<strong>Индивидуальные уроки</strong> — 60 минут, один ученик, полное внимание — хорошо, если хотите свой темп или конкретные цели. <strong>Групповые уроки</strong> — 90 минут на 2–3 человек — лучше, если приходите с другом или попутчиком и хотите общий опыт.',
      'faq.q.hp4': 'Нужен ли свой инструмент?',
      'faq.a.hp4': 'Нет. У нас есть инструменты для занятия. Если думаете о покупке — расскажем и поможем выбрать.',
      'faq.q.hp5': 'Где проходят уроки?',
      'faq.a.hp5': 'На открытой террасе Noom Studio в Ламае, или мы приедем к вам в отель, виллу или выбранное место на Самуи.',
      'faq.q.hp6': 'Я на Самуи всего на несколько дней — стоит ли одного урока?',
      'faq.a.hp6': 'Да. Одной сессии достаточно, чтобы освоить основы и унести что-то, что можно практиковать дальше, даже без инструмента.',

      'faq.q.pr1': 'Как записаться?',
      'faq.a.pr1': 'Напишите нам в WhatsApp или Instagram. Подберём время.',
      'faq.q.pr2': 'Сколько стоит?',
      'faq.a.pr2': 'Звуковые путешествия в студии — от <strong>2 500 THB за двоих</strong> (+500 THB за каждого дополнительного гостя, до 6). Выезд к вам — от <strong>4 000 THB за четверых</strong> (+500 THB за человека, до 12). Еженедельные открытые воскресенья — <strong>600 THB с человека</strong>. Цены на уроки хэндпана — напишите для уточнения.',
      'faq.q.pr3': 'Можно с детьми?',
      'faq.a.pr3': 'Да, напишите — подскажем, что подходит по возрасту.',
      'faq.q.pr4': 'Студия в помещении или на улице?',
      'faq.a.pr4': 'Открытая терраса в Ламае — деревья вокруг, открытое небо.',
      'faq.q.pr5': 'Что, если нужно отменить?',
      'faq.a.pr5': 'Бывает. Сообщите как можно раньше, что-нибудь придумаем.',

      'faq.q.ab1': 'Кто стоит за Noom Sound Studio?',
      'faq.a.ab1': 'Небольшая команда практиков на Ко Самуи. <strong>Can (Kazimcan)</strong> ведёт уроки хэндпана и джемы. Звуковые путешествия — в сотрудничестве с <strong>House of Holistic by Melie</strong>.',
      'faq.q.ab2': 'Где вы находитесь?',
      'faq.a.ab2': 'Ламай, южный берег Ко Самуи, Таиланд.',
      'faq.q.ab3': 'Работаете ли вы с отелями, ретритами или площадками?',
      'faq.a.ab3': 'Да — пишите о частных событиях, сессиях у вас или о постоянном партнёрстве.',

      'testimonials.eyebrow': 'Что говорят',
      'testimonials.title': 'От тех, кто<br/><em>пришёл и сыграл.</em>',
      'testimonials.lede': 'Гости, ученики, новички — люди, пришедшие, не зная, чего ожидать.',

      't1.quote': 'Я не представляла, что такое звуковое путешествие. Вышла так, будто проспала десять часов — такой тишины внутри не было уже годы. Ни на что не похоже.',
      't1.detail': 'Лондон, Великобритания · звуковое путешествие',
      't2.quote': 'Can провёл нам урок хэндпана на второй день на Самуи. К концу часа мы уже играли музыку вместе. Лучшее, что мы сделали за поездку.',
      't2.detail': 'Милан, Италия · урок хэндпана',
      't3.quote': 'Воскресные звуковые путешествия на террасе стали ритуалом моей поездки. Три недели подряд. Стоит планировать неделю вокруг этого.',
      't3.detail': 'Берлин, Германия · еженедельная сессия',

      'contact.eyebrow': 'Контакты',
      'contact.title': 'Пишите<br/><em>напрямую.</em>',
      'contact.lede': 'По частным урокам, звуковым путешествиям, приглашениям на джемы, событиям и сотрудничеству на Ко Самуи.',
      'contact.whatsapp': 'Написать в WhatsApp',
      'contact.instagram': 'Открыть Instagram',
      'contact.findUs': 'Как найти',
      'contact.address': 'Открытая терраса · Ламай, южный берег Ко Самуи, Таиланд',

      'mailing.eyebrow': 'Будьте в курсе',
      'mailing.title': 'Узнавайте первыми,<br/><em>что будет.</em>',
      'mailing.sub': 'Новые сессии, открытые джемы и встречи — прямо вам в почту. Без шума, только даты.',
      'mailing.placeholder': 'Ваш email',
      'mailing.button': 'Подписаться',
      'mailing.success': 'Вы в списке — скоро напишем.',
      'mailing.note': 'Без спама. Отписаться можно в любой момент.',

      'footer.comeplay': 'Приходи играть.',
    },

    tr: {
      'nav.events': 'Program',
      'nav.reviews': 'Yorumlar',
      'nav.faq': 'SSS',
      'nav.contact': 'İletişim',

      'hero.eyebrow': 'Koh Samui · Tayland',
      'hero.title': 'Handpan,<br/><em>birlikte çalınır.</em>',
      'hero.sub': 'Koh Samui’de handpan dersleri, ses yolculukları, haftalık jam ve hareket seansları.',
      'hero.cta': 'Programı gör &nbsp;&rarr;',
      'hero.scroll': 'Kaydır',

      'intro.p1': 'Koh Samui merkezli, ses ve hareket pratiği yapan küçük bir ekibiz. Handpan öğretiyor, canlı enstrümanlarla ses yolculukları düzenliyor, açık jam’ler ve haftalık seanslar tutuyoruz — çünkü bu pratiklerin yalnızca bilenlere değil, herkese açık olması gerektiğine inanıyoruz.',
      'intro.p2': 'Meraklı gel, yanında bir şey götür.',

      'pillars.eyebrow': 'Neler yapıyoruz',
      'pillars.title': 'Gelip çalmanın<br/><em>dört yolu.</em>',
      'pillars.lede': 'Sana uyanı seç. Dersler randevuyla; jam ve yolculuklar belirli tarihlerde; haftalık seans uğrayan herkese açık.',

      'pillar1.title': 'Handpan dersleri',
      'pillar1.body': '<strong style="font-weight:500;color:var(--ink)">Özel.</strong> Tek öğrenci, 60 dakika, senin ritmine göre — yeni başlayan ya da geri dönenler için.<br/><br/><strong style="font-weight:500;color:var(--ink)">Grup.</strong> İki ya da üç kişi, 90 dakika, birlikte ilerleyen — çiftler, arkadaşlar veya yol arkadaşları için.<br/><br/>Lamai’deki Noom Studio açık teras alanında ya da otelinize/villanıza geliriz.',
      'pillar1.cta': 'Rezervasyon için yazın &nbsp;&rarr;',

      'pillar2.title': 'Ses yolculukları',
      'pillar2.body': 'Canlı handpan, gong ve Tibet/kristal kâseler — siz uzanıp dinlenirken çalınır. Tecrübe gerekmez.<br/><br/><strong style="font-weight:500;color:var(--ink)">Özel</strong> seanslar stüdyoda veya bulunduğunuz yerde — ayarlamak için yazın.<br/><br/><strong style="font-weight:500;color:var(--ink)">Haftalık açık seans</strong> her Pazar 17:30’da Noom Studio terasında, Lamai — kontenjan sınırlı.',
      'pillar2.cta': 'Bir sonrakine katıl &nbsp;&rarr;',

      'pillar3.title': 'Jam’ler',
      'pillar3.body': 'Arkadaşlar gelir, enstrümanlar çıkar, çalarız. Handpan çalanlara, perküsyoncularla, şarkıcılara — katılmak isteyen herkese açık. Çay ve atıştırmalık; genelde geç biter.',
      'pillar3.cta': 'Bir sonrakine katıl &nbsp;&rarr;',

      'pillar4.title': 'Haftalık seanslar & etkinlikler',
      'pillar4.body': 'Herkese açık düzenli seanslar yapıyoruz — ses yolculukları, hareket ve ses buluşmaları, açık jam’ler. Tarih ve yerler mevsime göre değişir, takipte kalın. Bazıları ücretsiz. Bazıları gönüllü katkıyla. Hepsi açık.',
      'pillar4.cta': 'Yaklaşan tarihler &nbsp;&rarr;',

      'events.eyebrow': 'Program',
      'events.title': 'Seanslar, jam’ler<br/><em>& buluşmalar.</em>',
      'events.lede': 'Uğrayan herkese açık. Tarih ve yerler mevsime göre değişir — bir sonraki için listede olmak isterseniz yazın.',

      'ev1.price': '฿600',
      'ev1.title': 'Haftalık<br/><em>Ses Yolculuğu.</em>',
      'ev1.desc': 'Biz canlı handpan, gong ve kâse çalarken siz uzanın. Bir saatlik dinlenme, katılım gerekmez.',
      'ev1.when': 'Her Pazar · 17:30<br/><em>60 dk · Noom Studio Terası, Lamai</em>',

      'ev2.title': 'Ses<br/><em>& Hareket.</em>',
      'ev2.desc': 'Haftalık açık hava seansı — canlı enstrümanlar ve yumuşak hareket, yan yana. Herkese açık.',
      'ev2.when': 'Haftalık · açık hava<br/><em>Gün & yer duyurulur</em>',

      'ev3.price': 'Gönüllü katkı',
      'ev3.title': 'Handpan<br/><em>Atölyesi.</em>',
      'ev3.desc': 'Yeni başlayanlara uygun grup seansı — ilk sesler, basit kalıplar, birlikte çalmak için bir saat. Enstrümanlar bizden.',
      'ev3.when': 'Aylık · Lamai<br/><em>Tarihler duyurulur</em>',

      'ev4.title': 'Açık<br/><em>Jam.</em>',
      'ev4.desc': 'Müzisyenler ve meraklı dinleyiciler için akşam buluşması. Bir enstrüman getir ya da gel dinle.',
      'ev4.when': 'Tarihler değişir · Samui çevresi<br/><em>Bir sonrakini takip edin</em>',

      'common.whenWhere': 'Ne zaman & nerede',
      'common.join': 'Katıl &nbsp;&rarr;',
      'common.messageJoin': 'Katılmak için yazın &nbsp;&rarr;',
      'common.free': 'Ücretsiz',

      'faq.eyebrow': 'Sık sorulanlar',
      'faq.title': 'İnsanların<br/><em>merak ettikleri.</em>',
      'faq.lede': 'En sık aldığımız sorulara pratik yanıtlar. Aradığınızı bulamazsanız yazın — geri döneriz.',
      'faq1.title': 'Ses yolculukları<br/><em>hakkında.</em>',
      'faq2.title': 'Handpan dersleri<br/><em>hakkında.</em>',
      'faq3.title': 'Pratik<br/><em>bilgiler.</em>',
      'faq4.title': 'Noom Sound Studio<br/><em>hakkında.</em>',

      'faq.q.sj1': 'Seansta tam olarak ne oluyor?',
      'faq.a.sj1': 'Bir mindere uzanır, gözlerini kapatır ve dinlenirsin — biz canlı enstrümanlar çalarız: handpan, gong, Tibet ve kristal kâseler. Hepsi bu. Katılım gerekmez. Çoğu kişi tüm seans boyunca uyanıkla uyku arasında bir yerde olur.',
      'faq.q.sj2': 'Deneyime ya da geçmişe ihtiyacım var mı?',
      'faq.a.sj2': 'Yok. Müzik ya da ses çalışması hakkında bir şey bilmen gerekmiyor. Bir saat sakin uzanabiliyorsan hazırsın.',
      'faq.q.sj3': 'Nasıl bir his?',
      'faq.a.sj3': 'Her insanda farklı. Kimisi derin bir gevşeklik hisseder. Kimisi zihninin sessizleştiğini fark eder. Kimisi olağandışı bir şey hissetmeden yalnızca dinlenmiş çıkar. Hepsi iyi bir sonuçtur.',
      'faq.q.sj4': 'Meditasyon gibi mi?',
      'faq.a.sj4': 'Tam değil. Odaklanman ya da yönergeleri izlemen gerekmez. İşin büyük kısmını ses yapar — sen gelir ve bırakırsın.',
      'faq.q.sj5': 'Uyuyabilir miyim?',
      'faq.a.sj5': 'Evet, çoğu insan uyur.',
      'faq.q.sj6': 'Ne giymeli, ne getirmeliyim?',
      'faq.a.sj6': 'Rahat, bol kıyafetler. Minderler bizde. Çabuk üşüyorsan ince bir katman getir — bir saat hareketsiz yatmak beklediğinden daha çok üşütebilir.',
      'faq.q.sj7': 'Önceden yemeli miyim?',
      'faq.a.sj7': 'Hafif ye. Hemen öncesinde ağır bir yemek gevşemeyi zorlaştırır.',
      'faq.q.sj8': 'Gelmemem için bir sebep olabilir mi?',
      'faq.a.sj8': 'Hamileysen, epilepsin varsa, yakın zamanda ameliyat olduysan, işitme sorunun ya da belirgin bir ses hassasiyetin varsa — önce yaz, sana uygun olanı birlikte bulalım.',

      'faq.q.hp1': 'Handpan öğrenmek için müzik deneyimi gerekir mi?',
      'faq.a.hp1': 'Hayır. Bize gelenlerin çoğu daha önce hiç enstrüman çalmadı. Handpan, çaldığın hemen her şey iyi tınlayacak şekilde yapılmıştır — geleneksel anlamda yanlış nota yoktur.',
      'faq.q.hp2': 'Ne kadar hızlı öğrenirim?',
      'faq.a.hp2': 'Çoğu insan ilk seansından sonra gerçekten müziğe benzeyen basit kalıplar çalabilecek şekilde çıkar. Başlamak için en hızlı enstrümanlardan biridir.',
      'faq.q.hp3': 'Özel mi grup mu — hangisi bana uygun?',
      'faq.a.hp3': '<strong>Özel dersler</strong> 60 dakika, tek öğrenci, tam dikkat — kendi hızında ilerlemek ya da net bir hedefin varsa iyi. <strong>Grup dersleri</strong> 90 dakika, 2–3 kişi — bir arkadaş ya da yol arkadaşıyla ortak bir deneyim istiyorsan daha iyi.',
      'faq.q.hp4': 'Kendi enstrümanım olmalı mı?',
      'faq.a.hp4': 'Hayır. Seansta çalabileceğin enstrümanlar bizde. Almayı düşünüyorsan tavsiye etmekten mutluluk duyarız.',
      'faq.q.hp5': 'Dersler nerede yapılıyor?',
      'faq.a.hp5': 'Lamai’deki Noom Studio açık terasında ya da Samui’deki otelin, villan veya seçtiğin bir yere geliriz.',
      'faq.q.hp6': 'Samui’de yalnızca birkaç günüm var — tek bir ders değer mi?',
      'faq.a.hp6': 'Evet. Temelleri öğrenmek ve enstrüman olmadan bile çalışabileceğin bir şeyle ayrılmak için tek seans yeter.',

      'faq.q.pr1': 'Nasıl rezervasyon yaparım?',
      'faq.a.pr1': 'WhatsApp ya da Instagram’dan yazın. Uygun bir zaman buluruz.',
      'faq.q.pr2': 'Ücretler ne?',
      'faq.a.pr2': 'Stüdyodaki ses yolculukları <strong>iki kişi için 2.500 THB</strong>’den başlar (+her ek misafir için 500 THB, en fazla 6). Bulunduğunuz yere geliş <strong>dört misafir için 4.000 THB</strong>’den (+kişi başı 500 THB, en fazla 12). Pazar açık seansları <strong>kişi başı 600 THB</strong>. Handpan ders fiyatları — yazıp teyit edebilirsiniz.',
      'faq.q.pr3': 'Çocuk getirebilir miyim?',
      'faq.a.pr3': 'Evet, yazın — yaşa göre nasıl olacağını söyleriz.',
      'faq.q.pr4': 'Stüdyo iç mekân mı, açık hava mı?',
      'faq.a.pr4': 'Lamai’de açık hava terası — ağaçlarla çevrili, gökyüzü açık.',
      'faq.q.pr5': 'İptal etmem gerekirse?',
      'faq.a.pr5': 'Hayat akıyor. Mümkün olduğunca erken yazın, çözeriz.',

      'faq.q.ab1': 'Noom Sound Studio’yu kim yönetiyor?',
      'faq.a.ab1': 'Koh Samui’de küçük bir ekibiz. <strong>Can (Kazımcan)</strong> handpan derslerini ve jam’leri yönetiyor. Ses yolculukları <strong>House of Holistic by Melie</strong> ile birlikte düzenleniyor.',
      'faq.q.ab2': 'Neredesiniz?',
      'faq.a.ab2': 'Lamai, Koh Samui’nin güney sahili, Tayland.',
      'faq.q.ab3': 'Oteller, retreat veya mekânlarla çalışıyor musunuz?',
      'faq.a.ab3': 'Evet — özel etkinlikler, mekânda seanslar ya da uzun vadeli iş birlikleri için yazın.',

      'testimonials.eyebrow': 'İnsanlar ne diyor',
      'testimonials.title': 'Gelip<br/><em>çalanlardan.</em>',
      'testimonials.lede': 'Konuklar, öğrenciler, ilk kez gelenler — ne bekleyeceğini tam bilmeden gelen insanlar.',

      't1.quote': 'Gelmeden önce ses yolculuğunun ne olduğu hakkında hiçbir fikrim yoktu. Sanki on saat uyumuş gibi ayrıldım — yıllardır hissetmediğim bir sükûnetle. Benzeri yok.',
      't1.detail': 'Londra, BK · Ses Yolculuğu',
      't2.quote': 'Can bize Samui’ye geldiğimiz ikinci gün handpan dersi verdi. Bir saatin sonunda gerçekten birlikte müzik çalıyorduk. Tüm gezinin en iyi şeyi.',
      't2.detail': 'Milano, İtalya · Handpan Dersi',
      't3.quote': 'Pazar günkü teras seansları kalışım boyunca bir ritüel oldu. Üç hafta üst üste gittim. Tüm haftayı ona göre planlamaya değer.',
      't3.detail': 'Berlin, Almanya · Haftalık Seans',

      'contact.eyebrow': 'İletişim',
      'contact.title': 'Doğrudan<br/><em>yazın.</em>',
      'contact.lede': 'Koh Samui’deki özel dersler, ses yolculukları, jam davetleri, etkinlikler veya iş birlikleri için.',
      'contact.whatsapp': 'WhatsApp’tan yazın',
      'contact.instagram': 'Instagram’a git',
      'contact.findUs': 'Bizi bulun',
      'contact.address': 'Açık hava terası · Lamai, Koh Samui’nin güney sahili, Tayland',

      'mailing.eyebrow': 'Haberdar olun',
      'mailing.title': 'Neler olduğunu<br/><em>ilk siz bilin.</em>',
      'mailing.sub': 'Yeni seanslar, açık jam’ler ve buluşmalar — doğrudan e-postanıza. Gürültü yok, sadece tarihler.',
      'mailing.placeholder': 'E-posta adresiniz',
      'mailing.button': 'Listeye katıl',
      'mailing.success': 'Listedesiniz — sizinle iletişime geçeceğiz.',
      'mailing.note': 'Spam yok. İstediğiniz an çıkın.',

      'footer.comeplay': 'Gel, çal.',
    },

    he: {
      'nav.events': 'תוכנייה',
      'nav.reviews': 'חוות דעת',
      'nav.faq': 'שאלות',
      'nav.contact': 'יצירת קשר',

      'hero.eyebrow': 'קוֹ סָאמוּי · תאילנד',
      'hero.title': 'הנדפן,<br/><em>מנגנים יחד.</em>',
      'hero.sub': 'שיעורי הנדפן, מסעות צליל, ג׳אמים שבועיים וסשני תנועה בקו סאמוי.',
      'hero.cta': 'לתוכנייה &nbsp;&larr;',
      'hero.scroll': 'גלול',

      'intro.p1': 'אנחנו צוות קטן של אנשי צליל ותנועה שיושב בקו סאמוי. מלמדים הנדפן, מובילים מסעות צליל עם כלים חיים, מארחים ג׳אמים פתוחים ומקיימים סשנים שבועיים — כי אנחנו מאמינים שתרגול כזה צריך להיות נגיש לכולם, לא רק למי שכבר מכיר.',
      'intro.p2': 'בואו בסקרנות, צאו עם משהו.',

      'pillars.eyebrow': 'מה אנחנו עושים',
      'pillars.title': 'ארבע דרכים<br/><em>לבוא ולנגן.</em>',
      'pillars.lede': 'בחרו את מה שמתאים לכם. שיעורים לפי תיאום; ג׳אמים ומסעות בתאריכים קבועים; הסשן השבועי פתוח לכל מי שעובר.',

      'pillar1.title': 'שיעורי הנדפן',
      'pillar1.body': '<strong style="font-weight:500;color:var(--ink)">פרטי.</strong> תלמיד אחד, 60 דקות, בקצב שלכם — למתחילים ולמי שחוזרים.<br/><br/><strong style="font-weight:500;color:var(--ink)">קבוצתי.</strong> שניים-שלושה אנשים, 90 דקות, מונחים יחד — לזוגות, חברים או חברי טיול.<br/><br/>במרפסת הפתוחה של נום סטודיו בלמאי, או שנגיע למלון/וילה שלכם.',
      'pillar1.cta': 'כתבו לנו להזמנה &nbsp;&larr;',

      'pillar2.title': 'מסעות צליל',
      'pillar2.body': 'הנדפן חי, גונג וקערות טיבטיות/קריסטל — מנוגנים בזמן שאתם שוכבים ונחים. לא נדרש ניסיון.<br/><br/>סשנים <strong style="font-weight:500;color:var(--ink)">פרטיים</strong> בסטודיו או אצלכם — כתבו לנו לתיאום.<br/><br/><strong style="font-weight:500;color:var(--ink)">סשן פתוח שבועי</strong> בכל יום ראשון בשעה 17:30 במרפסת נום סטודיו, למאי — מקומות מוגבלים.',
      'pillar2.cta': 'הצטרפו לפעם הבאה &nbsp;&larr;',

      'pillar3.title': 'ג׳אמים',
      'pillar3.body': 'חברים מגיעים, הכלים יוצאים, ואנחנו מנגנים. פתוח לנגני הנדפן, מתופפים, זמרים — לכל מי שרוצה להצטרף. תה ונשנושים; בדרך כלל נמשך עד מאוחר.',
      'pillar3.cta': 'הצטרפו לפעם הבאה &nbsp;&larr;',

      'pillar4.title': 'סשנים ואירועים שבועיים',
      'pillar4.body': 'אנחנו מקיימים סשנים קבועים שפתוחים לכולם — מסעות צליל, מפגשי תנועה וצליל וג׳אמים פתוחים. התאריכים והמיקומים משתנים עם העונה, אז עקבו אחרינו כדי לא לפספס. חלק חינם. חלק בתרומה. הכל פתוח.',
      'pillar4.cta': 'לתאריכים הקרובים &nbsp;&larr;',

      'events.eyebrow': 'תוכנייה',
      'events.title': 'סשנים, ג׳אמים<br/><em>ומפגשים.</em>',
      'events.lede': 'פתוח לכל מי שעובר. התאריכים והמיקומים משתנים עם העונה — כתבו לנו כדי להיות ברשימה לפעם הבאה.',

      'ev1.price': '฿600',
      'ev1.title': 'מסע צליל<br/><em>שבועי.</em>',
      'ev1.desc': 'שכבו ונוחו בזמן שאנחנו מנגנים הנדפן, גונג וקערות בלייב. שעה של מנוחה, ללא השתתפות.',
      'ev1.when': 'כל יום ראשון · 17:30<br/><em>60 דק׳ · מרפסת נום סטודיו, למאי</em>',

      'ev2.title': 'צליל<br/><em>ותנועה.</em>',
      'ev2.desc': 'סשן שבועי בחוץ — כלים חיים ותנועה רכה, זה לצד זה. פתוח לכולם.',
      'ev2.when': 'שבועי · בחוץ<br/><em>יום ומיקום יוכרזו</em>',

      'ev3.price': 'בתרומה',
      'ev3.title': 'סדנת<br/><em>הנדפן.</em>',
      'ev3.desc': 'סשן קבוצתי ידידותי למתחילים — צלילים ראשונים, תבניות פשוטות, שעה של נגינה משותפת. כלים יסופקו.',
      'ev3.when': 'פעם בחודש · למאי<br/><em>תאריכים יוכרזו</em>',

      'ev4.title': 'ג׳אם<br/><em>פתוח.</em>',
      'ev4.desc': 'ערב פתוח למוזיקאים ולמאזינים סקרנים. הביאו כלי, או פשוט בואו והקשיבו.',
      'ev4.when': 'תאריכים משתנים · ברחבי סאמוי<br/><em>עקבו אחרי הפעם הבאה</em>',

      'common.whenWhere': 'מתי ואיפה',
      'common.join': 'להצטרף &nbsp;&larr;',
      'common.messageJoin': 'כתבו להצטרף &nbsp;&larr;',
      'common.free': 'חינם',

      'faq.eyebrow': 'שאלות נפוצות',
      'faq.title': 'מה שאנשים<br/><em>רוצים לדעת.</em>',
      'faq.lede': 'תשובות פרקטיות לשאלות הנפוצות ביותר. אם השאלה שלכם לא כאן — כתבו לנו, נחזור.',
      'faq1.title': 'על<br/><em>מסעות צליל.</em>',
      'faq2.title': 'על<br/><em>שיעורי הנדפן.</em>',
      'faq3.title': 'דברים<br/><em>פרקטיים.</em>',
      'faq4.title': 'על נום<br/><em>סאונד סטודיו.</em>',

      'faq.q.sj1': 'מה בעצם קורה בסשן?',
      'faq.a.sj1': 'אתם שוכבים על מזרן, עוצמים עיניים ונחים בזמן שאנחנו מנגנים כלים חיים — הנדפן, גונג וקערות טיבטיות וקריסטל. זה הכל. אין צורך בהשתתפות. רוב האנשים נעים בין ערות לשינה לאורך כל הסשן.',
      'faq.q.sj2': 'צריך ניסיון או רקע?',
      'faq.a.sj2': 'בכלל לא. אתם לא צריכים לדעת משהו על מוזיקה או עבודת צליל. אם אתם יכולים לשכב בשקט שעה — אתם מוכנים.',
      'faq.q.sj3': 'איך זה מרגיש?',
      'faq.a.sj3': 'שונה אצל כל אחד. יש מי שמרגישים רגיעה עמוקה. יש מי ששמים לב שהמחשבות נרגעות. ויש מי שלא מרגישים משהו יוצא דופן ופשוט יוצאים נחים. כל אחת מהאפשרויות בסדר.',
      'faq.q.sj4': 'זה כמו מדיטציה?',
      'faq.a.sj4': 'לא בדיוק. אין צורך להתרכז או לעקוב אחרי הנחיות. הצליל עושה את רוב העבודה — אתם רק מגיעים ומאפשרים.',
      'faq.q.sj5': 'אפשר להירדם?',
      'faq.a.sj5': 'כן, והרבה אנשים נרדמים.',
      'faq.q.sj6': 'מה ללבוש ולהביא?',
      'faq.a.sj6': 'בגדים נוחים ורפויים. מזרנים יש אצלנו. הביאו שכבה קלה אם קר לכם בקלות — שכיבה ללא תנועה במשך שעה יכולה לקרר יותר ממה שמצפים.',
      'faq.q.sj7': 'צריך לאכול לפני?',
      'faq.a.sj7': 'אכלו קל. ארוחה כבדה ממש לפני מקשה להירגע.',
      'faq.q.sj8': 'יש סיבות שלא לבוא?',
      'faq.a.sj8': 'אם אתם בהיריון, סובלים מאפילפסיה, אחרי ניתוח לאחרונה, עם בעיית שמיעה או רגישות גבוהה לרעש — כתבו קודם ונבדוק יחד מה מתאים.',

      'faq.q.hp1': 'צריך רקע מוזיקלי כדי ללמוד הנדפן?',
      'faq.a.hp1': 'לא. רוב מי שמגיעים אלינו מעולם לא ניגנו בכלי. הנדפן בנוי כך שכמעט כל מה שמנגנים יישמע טוב — אין נוטות שגויות במובן הקלאסי.',
      'faq.q.hp2': 'כמה מהר אפשר ללמוד?',
      'faq.a.hp2': 'רוב האנשים יוצאים מהסשן הראשון כשהם כבר מנגנים תבניות פשוטות שנשמעות באמת כמו מוזיקה. זה אחד הכלים המהירים ביותר להתחיל איתם.',
      'faq.q.hp3': 'פרטי או קבוצתי — מה עדיף?',
      'faq.a.hp3': '<strong>שיעור פרטי</strong> הוא 60 דקות, תלמיד אחד, תשומת לב מלאה — טוב אם אתם רוצים להתקדם בקצב שלכם או עם מטרה ספציפית. <strong>שיעור קבוצתי</strong> הוא 90 דקות לשניים-שלושה — עדיף אם באים עם חבר/חברה או בן/בת זוג לטיול ורוצים חוויה משותפת.',
      'faq.q.hp4': 'צריך כלי משלי?',
      'faq.a.hp4': 'לא. יש לנו כלים שתוכלו לנגן בהם בסשן. אם אתם שוקלים לקנות, נשמח לייעץ.',
      'faq.q.hp5': 'איפה השיעורים מתקיימים?',
      'faq.a.hp5': 'במרפסת הפתוחה של נום סטודיו בלמאי, או שנגיע למלון, לווילה או למקום שתבחרו בסאמוי.',
      'faq.q.hp6': 'אני רק כמה ימים בסאמוי — שווה שיעור אחד?',
      'faq.a.hp6': 'כן. שיעור אחד מספיק כדי ללמוד את היסודות ולצאת עם משהו שאפשר להמשיך לתרגל איתו, גם בלי כלי.',

      'faq.q.pr1': 'איך מזמינים?',
      'faq.a.pr1': 'כתבו לנו בוואטסאפ או באינסטגרם. נמצא זמן מתאים.',
      'faq.q.pr2': 'כמה זה עולה?',
      'faq.a.pr2': 'מסעות צליל בסטודיו מתחילים ב־<strong>2,500 THB לזוג</strong> (+500 THB לאורח נוסף, עד 6). אצלכם מ־<strong>4,000 THB לארבעה אורחים</strong> (+500 THB לאדם, עד 12). הסשן הפתוח השבועי בימי ראשון הוא <strong>600 THB לאדם</strong>. מחירי שיעורי הנדפן — כתבו לאישור.',
      'faq.q.pr3': 'אפשר להביא ילדים?',
      'faq.a.pr3': 'כן, כתבו לנו ונגיד מה מתאים לפי גיל.',
      'faq.q.pr4': 'הסטודיו בפנים או בחוץ?',
      'faq.a.pr4': 'מרפסת פתוחה בלמאי — מוקפת בעצים, שמיים פתוחים.',
      'faq.q.pr5': 'מה אם אני צריך לבטל?',
      'faq.a.pr5': 'החיים קורים. כתבו מוקדם ככל האפשר, נסתדר.',

      'faq.q.ab1': 'מי מאחורי נום סאונד סטודיו?',
      'faq.a.ab1': 'צוות קטן של אנשי תרגול בקו סאמוי. <strong>Can (קזימג׳אן)</strong> מוביל את שיעורי ההנדפן והג׳אמים. מסעות הצליל בשיתוף עם <strong>House of Holistic by Melie</strong>.',
      'faq.q.ab2': 'איפה אתם נמצאים?',
      'faq.a.ab2': 'למאי, חוף דרומי של קו סאמוי, תאילנד.',
      'faq.q.ab3': 'האם אתם עובדים עם מלונות, ריטריטים או חללים?',
      'faq.a.ab3': 'כן — כתבו לנו על אירועים פרטיים, סשנים במקום או שיתופי פעולה מתמשכים.',

      'testimonials.eyebrow': 'מה אומרים',
      'testimonials.title': 'ממי שבאו<br/><em>וניגנו.</em>',
      'testimonials.lede': 'אורחים, תלמידים ואנשים שהגיעו בפעם הראשונה — מבלי לדעת בדיוק למה לצפות.',

      't1.quote': 'לא היה לי מושג מה זה מסע צליל לפני שהגעתי. יצאתי בתחושה שישנתי עשר שעות — שקט שלא הרגשתי שנים. אין מה להשוות.',
      't1.detail': 'לונדון, בריטניה · מסע צליל',
      't2.quote': 'Can נתן לנו שיעור הנדפן ביום השני שלנו בסאמוי. בסוף השעה כבר ניגנו מוזיקה ביחד באמת. הדבר הכי טוב שעשינו בכל הטיול.',
      't2.detail': 'מילאנו, איטליה · שיעור הנדפן',
      't3.quote': 'מסע הצליל של יום ראשון על המרפסת הפך לטקס במהלך השהות שלי. הלכתי שלושה שבועות ברצף. שווה לתכנן את השבוע סביבו.',
      't3.detail': 'ברלין, גרמניה · סשן שבועי',

      'contact.eyebrow': 'יצירת קשר',
      'contact.title': 'כתבו לנו<br/><em>ישירות.</em>',
      'contact.lede': 'לשיעורים פרטיים, מסעות צליל, הזמנות לג׳אם, אירועים או שיתופי פעולה בקו סאמוי.',
      'contact.whatsapp': 'כתבו בוואטסאפ',
      'contact.instagram': 'לאינסטגרם',
      'contact.findUs': 'איך מגיעים',
      'contact.address': 'מרפסת פתוחה · למאי, חוף דרומי של קו סאמוי, תאילנד',

      'mailing.eyebrow': 'הישארו מעודכנים',
      'mailing.title': 'דעו ראשונים<br/><em>מה קורה.</em>',
      'mailing.sub': 'סשנים חדשים, ג׳אמים פתוחים ומפגשים — ישירות לתיבה. בלי רעש, רק תאריכים.',
      'mailing.placeholder': 'כתובת המייל שלכם',
      'mailing.button': 'הצטרפו',
      'mailing.success': 'אתם ברשימה — נהיה בקשר.',
      'mailing.note': 'בלי ספאם. אפשר להסיר בכל עת.',

      'footer.comeplay': 'בואו לנגן.',
    },
  };

  // Names for the dropdown
  const LANG_NAMES = {
    en: { native: 'English', code: 'EN' },
    th: { native: 'ภาษาไทย', code: 'TH' },
    de: { native: 'Deutsch', code: 'DE' },
    fr: { native: 'Français', code: 'FR' },
    ru: { native: 'Русский', code: 'RU' },
    tr: { native: 'Türkçe', code: 'TR' },
    he: { native: 'עברית', code: 'HE' },
  };

  // ----- Snapshot the original English so we can restore it on lang=en -----
  const ORIGINAL = new Map();          // el -> { html, placeholder }
  function snapshotOriginals() {
    document.querySelectorAll('[data-i18n], [data-i18n-placeholder]').forEach(el => {
      ORIGINAL.set(el, {
        html: el.innerHTML,
        placeholder: el.getAttribute('placeholder') || null,
      });
    });
  }

  // ----- Apply a language to the DOM -----
  function applyLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = 'en';
    const dict = lang === 'en' ? null : T[lang] || null;

    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL_LANGS.includes(lang) ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict && dict[key] != null) {
        el.innerHTML = dict[key];
      } else {
        // restore EN original
        const orig = ORIGINAL.get(el);
        if (orig) el.innerHTML = orig.html;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict && dict[key] != null) {
        el.setAttribute('placeholder', dict[key]);
      } else {
        const orig = ORIGINAL.get(el);
        if (orig && orig.placeholder != null) el.setAttribute('placeholder', orig.placeholder);
      }
    });

    // Update toggle label + selected state in menu
    const label = document.getElementById('langLabel');
    if (label) label.textContent = LANG_NAMES[lang].code;
    document.querySelectorAll('#langMenu [role="option"]').forEach(li => {
      li.setAttribute('aria-selected', li.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  // ----- Detection -----
  async function detectLang() {
    // 1) Explicit user choice
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;

    // 2) IP-based (free, CORS-enabled). Soft-fails to navigator.language.
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 2500);
      const resp = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        const cc = (data && data.country_code || '').toUpperCase();
        if (cc && COUNTRY_TO_LANG[cc]) return COUNTRY_TO_LANG[cc];
      }
    } catch (_) { /* fall through */ }

    // 3) Browser language
    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    const base = nav.split('-')[0];
    if (SUPPORTED.includes(base)) return base;

    return 'en';
  }

  // ----- Dropdown wiring -----
  function setupDropdown() {
    const wrap = document.getElementById('lang');
    const btn = document.getElementById('langBtn');
    const menu = document.getElementById('langMenu');
    if (!wrap || !btn || !menu) return;

    const open = () => { wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); };
    const close = () => { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    const toggle = () => wrap.classList.contains('open') ? close() : open();

    btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    menu.addEventListener('click', (e) => {
      const li = e.target.closest('[role="option"]');
      if (!li) return;
      const lang = li.getAttribute('data-lang');
      localStorage.setItem(STORAGE_KEY, lang);
      applyLang(lang);
      close();
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  // ----- Boot -----
  function boot() {
    snapshotOriginals();
    setupDropdown();
    // Render EN immediately so nothing flashes; then asynchronously detect.
    applyLang('en');
    detectLang().then(lang => {
      if (lang && lang !== 'en') applyLang(lang);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
