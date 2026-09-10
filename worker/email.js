// Email via Resend (BOOKING-SPEC section 11). Plain text only.
// The domain noomsound.studio is verified in Resend; RESEND_KEY is a Worker secret.

const FROM = "Noom Sound Studio <bookings@noomsound.studio>";
export const PUBLIC_REPLY_TO = "noomsoundstudio@gmail.com";

// Returns true when Resend accepted the message. Never throws: a failed email must not
// undo a booking that is already stored.
export async function sendEmail(env, { to, subject, text, replyTo }) {
  const recipients = (Array.isArray(to) ? to : [to]).map((s) => s.trim()).filter(Boolean);
  if (!env.RESEND_KEY || !recipients.length) {
    console.log(`email: skipped "${subject}" (no key or no recipient)`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: FROM, to: recipients, subject, text, reply_to: replyTo }),
    });
    if (!res.ok) {
      console.log(`email: Resend ${res.status} for "${subject}": ${(await res.text()).slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.log(`email: failed "${subject}": ${err.message}`);
    return false;
  }
}

export function alertRecipients(env) {
  return (env.ALERT_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
}
