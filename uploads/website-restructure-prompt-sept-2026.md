# Noom Sound Studio website restructure prompt (September 2026, v3)

Run this after the September content update. Paste everything below the line into Claude Design.

---

You are restructuring the existing Noom Sound Studio site at noomsound.studio. The content is now correct. The structure is not. This pass reorders, merges and cuts. Do not invent new offers and do not change prices.

Keep the design system exactly as it is: cream and beige palette, Cormorant Garamond for display type, Jost for labels and body, generous spacing, thin rules between blocks, small uppercase letter-spaced section labels.

Copy rules: no em dashes, no emoji, no spiritual jargon, no exclamation marks. Short sentences. Plain words.

## The problem you are fixing

The page is one long scroll of about 41,500 pixels and it says the same things repeatedly.

The weekly Sound Journey is currently sold in four separate places: the Sessions strip, the Sound Journeys section, item 02 of What We Do, and item 01 of What's On. Handpan lessons are sold in three places: the 3-Day Journey block at the top, the Learn Handpan section, and item 01 of What We Do.

The navigation order and the scroll order also disagree. The menu lists Learn Handpan second, but that section is the seventh on the page.

Target after this pass: around 20,000 pixels, roughly half the current height, with no fact stated twice.

## The single rule that fixes it

Dates and times live in exactly one section: What's On. No other section on the site may list a day, a time or a recurring date. Other sections may link to What's On. What's On links to nothing above or below it. Traffic flows one way.

## New section order

Replace the current order with this. The navigation must match it exactly, in this sequence.

1. Hero
2. What's On (id: whatson)
3. The Regulars (id: regulars)
4. Sound Journeys (id: soundjourneys)
5. Learn Handpan (id: learn), with the 3-Day Journey detail folded in beneath it
6. Workshops (id: workshops)
7. Who We Are (id: whoweare) NEW
8. Reviews and venues (id: reviews)
9. FAQ (id: faq)
10. Contact (id: contact)
11. Mailing list (id: mailing)

Navigation: What's on, The Regulars, Sound journeys, Learn handpan, Workshops, Who we are, Reviews, FAQ, Contact.

Keep the old anchors #sessions, #events and #journey alive as aliases that scroll to the new sections, so any links already shared on Instagram still work.

## What to delete

**Delete the What We Do section entirely** (currently id: pillars, "Four ways to come and play"). It summarises four things the visitor has not read yet, and it arrives after most of them. Every fact in it already appears elsewhere. Nothing from it needs rescuing except one line about jams, which moves into the FAQ as an answer to "Do you run open jams?"

**Delete the standalone What's On section** (currently id: events). Its two Mulajoy items move into the new What's On block described below. Its weekly Sound Journey item is a duplicate and simply goes.

**Delete the standalone 3-Day Journey section** as a separate top-of-page block (currently id: journey). Its content moves under Learn Handpan.

## 1. Hero: two doors

The current hero sells handpan lessons, then the page immediately shows a 600 THB session schedule. Two different visitors arrive here and only one is addressed.

Split the hero into two clear doors so each visitor knows where to go within one screen.

Headline:
Live sound, on a terrace above the sea.

Subline:
Weekly sound journeys, handpan lessons and workshops in Lamai, Koh Samui. No experience needed.

Then two side-by-side cards, equal weight, each a large clickable panel. On mobile they stack.

Door one, links to What's On:
JOIN A SESSION
From 600 THB
Wednesday, Sunday and full moon.

Door two, links to Learn Handpan:
LEARN HANDPAN
From a single lesson
Try it once, or take the three-day course.

Keep the hero short. It should fit one screen on a phone including both doors, with the top of What's On just visible beneath.

## 2. What's On: the only place dates exist

One block holding all five recurring things. Two groups separated by a thin rule and a small label.

Section label: WHAT'S ON

Headline:
Everything with a date.

First group, small uppercase label: ON OUR TERRACE

Row 1
WEDNESDAY / 17:30 (5:30 pm)
NOOM TERRACE, LAMAI / 75 min / 600 THB

Row 2
SUNDAY / 17:30 (5:30 pm)
NOOM TERRACE, LAMAI / 75 min / 600 THB

Row 3
FULL MOON / 18:00 (6:00 pm)
LOCATION ANNOUNCED EACH MONTH / 75 min / 600 THB
Small date list: MONTHLY. 26 SEPT. 26 OCT. 24 NOV. 24 DEC

Inside row 3, keep the editable location line wrapped in its HTML comment so it stays easy to find in the exported file:

<!-- EDIT EACH MONTH: full moon location -->
26 September. Location announced soon.

Then a thin rule and the second group, small uppercase label: ELSEWHERE ON THE ISLAND

Row 4
MONTHLY SOUND THERAPY / FIRST THURSDAY / 17:00 (5:00 pm)
MULAJOY / 60 min / 650 THB

Row 5
CHILDREN'S RHYTHM WORKSHOP / EVERY WEDNESDAY / 11:00 (11:00 am)
MULAJOY / ages six to fourteen / by contribution

Show both the 24-hour and the 12-hour time on every row. Many visitors read one and not the other, and a missed session is a lost booking.

Beneath the terrace group, one italic line:
Five minutes from Lamai beach, in the forest above the sea.

Beneath the whole block, a short reassurance line in body type, set apart with thin rules above and below. This removes the main hesitation of someone who has never heard of a sound journey:

You lie on a mat and rest. There is nothing to learn and nothing to say, and you can leave whenever you like. Handpan, crystal and Tibetan bowls, gong. Eight mats only.

Directly beneath that, one small line with a forward link down to Who We Are:
Two of us play. Meet us before you come.

Then two buttons, side by side:
BOOK A MAT
TELL ME WHEN THE FULL MOON LOCATION IS SET

## 3. The Regulars

Keep this section exactly as it is now. It is working. It stays directly after What's On, because the visitor has just seen five things they could attend and this is what makes attending them cheap.

One change only: remove any date or day mentioned in this section. Replace with "any Noom session" where needed.

## 4. Sound Journeys

This section currently repeats the schedule. Strip every date and day out of it. It now answers only two questions: what happens, and what a private one costs.

Section label: SOUND JOURNEYS
Headline: Rest, while we play.

Opening paragraph:
Live handpan, gong and bowls, played while you lie back and rest. Join an open session on the terrace, or book privately for two or a small group, here or wherever you are staying.

Then two cards only, not three. The weekly and open card is removed, because those dates now live in What's On.

Card one:
AT THE STUDIO
Noom Terrace, Lamai
from 2,500 THB
For two. Plus 500 THB per extra guest, up to seven.
An hour of live sound on the open-air terrace. Mats, tea and the evening air included.
Button: Message to book

Card two:
WE COME TO YOU
At your place
from 4,000 THB
For two. Plus 500 THB per guest, up to ten.
Your villa, hotel or retreat. We bring the instruments and set the room.
Button: Message to book

Beneath the two cards, one quiet line with a link up to What's On:
Prefer to join an open session? All dates are in What's On.

Keep the existing line about collaborating with spas, hotels and studios.

## 5. Learn Handpan, with the Journey folded in

Move this section up to fifth position and merge the deleted 3-Day Journey block into it, so everything about lessons sits in one continuous stretch of the page.

Structure it as three cards followed by one expanded panel.

Three cards, as they are now:
- Demo lesson, 2,000 THB, one session
- 3-Day Handpan Journey, 10,000 THB, ten hours over three days, certificate included
- 8-lesson course, 12,000 THB, eight lessons of 90 minutes

Make the 3-Day Journey card visually dominant, since it is the signature offer.

Directly beneath the cards, place the full 3-Day Journey content from the deleted section: the six things included, the certificate, the loaned handpan, the recorded piece, the video lessons. Give it the tinted panel treatment so it reads as a deeper level rather than a fourth product.

Remove the old "Read about the Journey" jump link. The content is now immediately below.

Keep the existing note that half the demo lesson cost is deducted from the Journey price.

## 6. Workshops

Keep as it is. It stays after Learn Handpan.

## 7. Who We Are, new section

This is the biggest gap on the current site. The page has one photograph and no faces, and the question "Who runs Noom Sound Studio?" is buried as the fourth item inside the fourth FAQ group.

Consider what the site asks a stranger to do. Come to a private terrace in a forest, five minutes off the beach, at 17:30. Lie down. Close their eyes for 75 minutes while someone they have never seen plays a gong near their head. That is a high-trust request, and it is currently made by a page that never shows who will be in the room. For solo travellers, who are a large share of this audience, this section may decide whether they come.

Place it after Workshops, before Reviews, so it opens the trust region of the page.

Include one portrait photograph of the two of us, calm and unposed, not performing. Set it beside the text, not as a background. This is the only new image the site needs. Everything else visual stays on Instagram.

Section label: WHO WE ARE
Headline: Two people, one terrace.

Body:

Noom Sound Studio is Can and Melie. Can plays handpan and teaches it. Melie runs House of Holistic. We hold the sessions together on the terrace where we live and work, above the sea in Lamai.

Can has taught more than fifty students and takes three or four new ones each month. We are invited to play at Kamalaya, Anantara Lawana, 5 Elements, W and Conrad, and we hold a place in the Kamalaya wellness programme.

We play and teach from how sound actually works. Which notes sit well together, why a bowl keeps ringing after you let it go, how a room changes what you hear. Nothing here has to be a mystery to move you.

You need no experience and you have to do nothing. Come as you are, lie down, and let us play.

Do not add any claim about formal training, certification or accreditation. Sound therapy is unregulated and the venue list already carries more weight than a certificate would. Write only what appears above.

Beneath the body, a small quiet line:
Noom Studio Co., Ltd. Registered on Koh Samui.

At the foot of this section, one line and a link out:
See sessions as they happen on Instagram.
Link to instagram.com/noomsoundstudio. A single line and a button, not an embedded feed and not a gallery. The site stays text-first.

## 8. The practical answers a visitor needs

These are missing and each one costs bookings. Add them where noted.

**Rain.** Add to the reassurance block under What's On, and as an FAQ answer:
The terrace is covered, so sessions run in the rain. Rain on the roof is part of it.

**Eight mats.** Replace every use of "limited mats" across the whole site with "eight mats only". It is honest, concrete, and creates real urgency rather than vague scarcity.

**Paying.** Add as an FAQ answer under the practical group:
Cash or a Thai QR transfer, either at the session or before it. Bring 600 baht if you prefer cash.

**Language.** Add one line to the reassurance block under What's On:
Sessions run in English.

**Finding us.** The line "in the forest above the sea" is beautiful and impossible to navigate by. In the Contact section, beside the existing map, add three short practical lines under a small label GETTING HERE:
Five minutes inland from Lamai beach.
Park at the top and walk down. We will send a pin when you book.
Arrive ten minutes early so you can settle.

**After you message.** Add one small line beneath every WhatsApp button on the site, in the smallest body size:
We usually reply within a few hours.

**Mailing list.** It currently has no reason to exist. Give it the one it already has. Change its subline to:
The full moon location is announced here first, along with new sessions and gatherings.

## 9. FAQ

Keep the existing questions. Add these:

Do you run open jams?
Sometimes. Friends visit, the instruments come out, and we play. If you would like to know when one is happening, join the mailing list.

What happens if it rains?
The terrace is covered, so sessions run. Rain on the roof is part of it.

How do I pay?
Cash or a Thai QR transfer, either at the session or before it.

How many people are in a session?
Eight mats, so eight people. It stays small on purpose.

Move the existing question "Who runs Noom Sound Studio?" out of the FAQ. It is answered by the new Who We Are section, and a visitor should not have to open an accordion to find out who they will be lying down in front of.

Remove any answer that restates a day, time or price already given in What's On. Replace with a pointer to What's On.

## 10. Reviews and venues, merged and cut

Reviews are currently around 9,900 pixels, a quarter of the entire page. Cut to five.

Keep five reviews, chosen from the existing verified Google reviews: two from handpan students and three from sound journey guests. Pick the five that are most specific, not the five that are most enthusiastic. A review that names what happened persuades a stranger; a review that only says it was amazing does not.

Beneath them, one quiet line:
Read the rest on Google.

Merge the Where We've Played venue block into the bottom of this same section, under a small label:
WHERE WE'VE PLAYED

Keep the venue names as they are. This block is the strongest trust signal on the site. Hotels of that level vet the people they put in front of guests, and every visitor understands that without being told. Give it room.

## 11. Contact and mailing list

Keep both, with the two additions described in section 8: the GETTING HERE lines beside the map, and the new mailing list subline.

## Cross-cutting checks before you finish

**One direction of travel.** Search the finished page for links that point backwards up the page. There should be exactly one, the line in Sound Journeys pointing to What's On. Remove any others. The old page had Sessions and What's On linking to each other, which left visitors circling.

**No fact twice.** Read the finished page top to bottom as a visitor. If a price, a day or a description appears in two sections, delete the second one.

**Hebrew right to left.** Check the HE version specifically. The schedule rows put a day on the left and a time on the right, and the price lines use slashes. Verify these mirror correctly in RTL and that nothing overlaps or reverses into nonsense. Do the same quick check on TH, which has taller line heights than Latin scripts.

**All seven languages.** Every changed or new line above needs EN, TH, DE, FR, RU, TR and HE. Do not leave the new hero doors or the What's On block English-only.

**Photography.** Where images appear beside sessions, make sure the set does not read as a women-only offering. Mixed guests, and at least one image where the visitor cannot tell who is in the room.

**Company name in the footer.** Add Noom Studio Co., Ltd. to the footer line. A resident spending 2,000 THB on a pass with no receipt wants to see a registered business, not just a name.

**Phone first.** Most visitors arrive by scanning a printed QR code, so they are on a phone, outdoors, possibly in sunlight. Check contrast on the cream backgrounds, and check that the two hero doors and the first two rows of What's On are reachable without pinching or zooming.

## Output

Return the complete single-file index.html, self-contained, all translations updated, ready to replace the current file on GitHub.
