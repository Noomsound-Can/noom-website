# Noom Sound Studio website update prompt (September 2026)

Paste everything below the line into Claude Design.

---

You are updating the existing Noom Sound Studio site at noomsound.studio. This is an edit to a live page, not a redesign. Keep the current design system exactly: the cream and beige palette, Cormorant Garamond for display type, Jost for labels and body, the generous spacing, the thin rules between blocks, the small uppercase letter-spaced section labels. Every new section must look like it was always there.

The site has a language selector (EN, TH, DE, FR, RU, TR, HE). Every new or changed line of copy below needs a translation in all seven languages, in the same understated register as the existing translations. Do not leave new sections English-only.

House rules for all copy: no em dashes, no emoji, no spiritual jargon, no exclamation marks. Short sentences. Plain words. Calm and specific rather than mystical.

## Why this update exists

A person picks up a printed flyer in Lamai, scans the QR code, and lands on this page. The flyer sold them a 600 THB session on a terrace in the forest above the sea. Right now the page opens with a handpan course at 10,000 THB and the schedule sits far down. The page answers a question they did not ask.

The job of this update is to make the first screen match the paper in their hand, and then give them one clear thing to do.

## 1. Corrections to existing content

These are wrong on the live site. Fix them.

**Weekly Sound Journey.** It now runs twice a week, not once.

- Wednesday, 17:30, Noom Terrace, Lamai
- Sunday, 17:30, Noom Terrace, Lamai
- 75 minutes. 600 THB. Handpan, crystal and Tibetan bowls, gong. Limited mats.

**Children's Rhythm Workshop.** Change from "Every Tuesday, 10:30am" to "Every Wednesday, 11:00, Mulajoy". It starts in September.

**Monthly Sound Therapy at Mulajoy.** Keep it. First Thursday of the month, 17:00, one hour, 650 THB, at Mulajoy.

**Airbnb Experiences.** Remove this block entirely, including its button. The listing is not live and the link goes nowhere.

## 2. New: the schedule strip

Add a compact schedule block high on the page, directly under the hero, before the 3-Day Handpan Journey section. It is the first thing a flyer visitor should see after the headline. It is a near-copy of the printed flyer, so the paper and the screen agree.

Layout: three rows, each with the day name large in Cormorant Garamond on the left, the time on the right, and a small uppercase location line beneath the day. A thin rule between rows. Then a single centred line underneath carrying the format and price.

Row 1
WEDNESDAY / 17:30
NOOM TERRACE, LAMAI

Row 2
SUNDAY / 17:30
NOOM TERRACE, LAMAI

Row 3
FULL MOON / 18:00
LOCATION ANNOUNCED EACH MONTH
Small right-aligned date list: MONTHLY. 26 SEPT. 26 OCT. 24 NOV. 24 DEC

Line below the rows, italic, smaller:
Five minutes from Lamai beach, in the forest above the sea.

Line below that, centred, with a thin rule above and below:
75 minutes. 600 THB. Handpan, crystal and Tibetan bowls, gong. Limited mats.

Then one button, centred, in the existing button style:
Book a mat

### The full moon location line

Inside the FULL MOON row, add a single editable line that I will change by hand each month. Wrap it in an HTML comment so it is easy to find in the exported file:

<!-- EDIT EACH MONTH: full moon location -->

For September it reads:
26 September. Location announced soon.

When a location is confirmed the line becomes, for example:
26 September. Noom Terrace, Lamai.

Make this line visually distinct enough that a returning visitor spots it, but do not make it a coloured badge. A small centred line in the accent tone is enough. This line is a reason for people to come back to the site every month, so it should be findable without scrolling far.

## 3. New: The Regulars

This is the most important new section on the site. It is a four-session pass, and it is what turns one visit into four. Give it a full section with real weight, on the tinted beige panel background the site already uses for emphasis, placed directly after the schedule strip.

Section label: THE REGULARS

Headline, large, in Cormorant Garamond:
2,000 THB. Four sessions. Valid one year.

Body, in three short paragraphs:

Use them at any Noom session, weekly or full moon. No booking window, no expiry pressure, no membership fee.

Bring a friend and spend two at once. The pass is not tied to your name.

Two full passes buy a private evening on the terrace for up to eight guests, on your date and at your time. Book one week ahead, subject to availability.

Then a small three-item list under a thin rule, each item a short line with a label:

HOW TO GET ONE
Message us and we send a QR code to pay, or pay cash at your first session.
You get a PDF pass straight away, and a printed card when you arrive.

Button:
Get a pass

Run jointly as Noom Sound Studio and House of Holistic, so include both names in a small line at the foot of this section, matching how the flyer does it.

## 4. New: Workshops

A teaser section. The product is real and priced, but dates are not set. Place it after the Sound Journeys section.

Section label: WORKSHOPS

Headline:
Learn to play the instruments yourself.

Use a blurred photograph as the section background or as a large image block beside the text. Blur it heavily, around 20 to 24 pixels, and lay a cream wash over it at roughly 60 percent so the type stays readable. It should read as a photograph you cannot quite see yet, not as a broken image. Add a small uppercase line over it:
COMING SOON

Body copy:

Three days of hands-on sound, in small groups on the terrace. Bowls on day one. Gong and metal on day two. Putting it together on day three. You play the instruments, not just listen to them.

We are still shaping this one. The aim is simple: give you the most we can in the least time, so you leave able to hold a session yourself.

Pricing block, three lines, quiet and evenly spaced:
One day. 4,000 THB.
Two days. 7,500 THB.
All three days. 10,000 THB.

Small line beneath:
Any single day, any two days, or all three. Each day stands alone.

Button:
Tell me when it opens

## 5. Pre-filled WhatsApp messages

Every button on the site currently opens a blank WhatsApp chat. A blank chat is friction. Give each button its own pre-filled message so the visitor only has to press send.

Use the existing number: wa.me/905468419181?text=

Set them as follows. URL-encode the text.

- Book a mat (schedule strip): Hi Noom, I would like a mat for a Sound Journey. Which day has space?
- Full moon: Hi Noom, I would like a mat for the full moon session.
- Get a pass (The Regulars): Hi Noom, I would like to get The Regulars pass.
- Private evening (if you add a link inside The Regulars): Hi Noom, I have two passes and would like to book a private evening on the terrace.
- Demo handpan lesson: Hi Noom, I would like to try a handpan lesson. When are you free?
- 3-Day Handpan Journey: Hi Noom, I would like to know more about the 3-Day Handpan Journey.
- 8-lesson course: Hi Noom, I am interested in the eight lesson handpan course.
- Sound journey at the studio: Hi Noom, I would like a private sound journey on the terrace. My dates are:
- Sound journey at your place: Hi Noom, I would like a sound journey at my villa. My dates are:
- Workshops waitlist: Hi Noom, tell me when the sound workshops open. I am interested in one day / two days / all three.
- General contact button: Hi Noom, I have a question.

## 6. Navigation and hero

In the nav, add a link called Sessions that jumps to the schedule strip, and place it first. The current order buries the cheapest and easiest thing to say yes to.

New nav order: Sessions, Learn handpan, Sound journeys, Workshops, The Regulars, Reviews, FAQ, Contact.

In the hero, keep the headline "Learn handpan by the sea" but change the second button from "See what's on" to "This week's sessions", pointing at the schedule strip. Keep "Start learning" as the first button.

## 7. What's on section

Keep this section but simplify it, since the schedule strip above now carries the weekly and full moon sessions. What's on should hold only the things that happen elsewhere:

- Children's Rhythm Workshop. Every Wednesday, 11:00. Mulajoy. Ages six to fourteen.
- Monthly Sound Therapy. First Thursday, 17:00. Mulajoy. 650 THB.

Remove the duplicated weekly session and the Airbnb block.

## 8. Two small things

Add the House of Holistic name alongside Noom Sound Studio in the footer, matching the flyer, which reads: NOOM SOUND STUDIO . HOUSE OF HOLISTIC

In the FAQ, add three questions under the existing practical group:

How do I pay for a pass?
We send a QR code on WhatsApp, or you pay cash at your first session. You get a PDF pass straight away and a printed card when you arrive.

Can someone else use my pass?
Yes. Bring a friend and spend two sessions at once.

Where is the full moon session held?
The location changes each month and is announced on this page.

## Output

Return the complete single-file index.html, self-contained, with all translations updated, ready to replace the current file on GitHub.
