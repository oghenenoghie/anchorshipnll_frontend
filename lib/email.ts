import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const NOTIFY_FROM = process.env.NOTIFY_FROM_EMAIL ?? "AnchorShip NL <notifications@anchorship.nl>";
const NOTIFY_TO = process.env.NOTIFY_TO_EMAIL ?? "sales@anchorship.nl";

export interface NotificationEmail {
  subject: string;
  replyTo: string;
  text: string;
}

// Falls back to a console log when RESEND_API_KEY isn't set, so forms stay usable
// in local/dev environments without a real Resend account configured yet.
export async function sendNotificationEmail(email: NotificationEmail): Promise<void> {
  if (!resend) {
    console.log("[email:dev] RESEND_API_KEY not set — logging instead of sending.\n", email);
    return;
  }

  const { error } = await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: email.replyTo,
    subject: email.subject,
    text: email.text,
  });

  if (error) {
    throw new Error(`Failed to send notification email: ${error.message}`);
  }
}
