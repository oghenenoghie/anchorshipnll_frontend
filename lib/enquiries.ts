import { createEnquiry, markEnquiryEmailSent, type EnquiryInput } from "@/lib/db/queries";
import { sendNotificationEmail, type NotificationEmail } from "@/lib/email";

// Saves the enquiry first, then sends the notification email, so a lead is
// never lost to a single failure: either one succeeding is enough. Returns
// false only when both the save and the send failed and the submitter needs
// to try again.
export async function recordEnquiry(input: EnquiryInput, email: NotificationEmail): Promise<boolean> {
  let savedId: string | undefined;
  try {
    savedId = (await createEnquiry(input)).id;
  } catch (err) {
    console.error(`Saving ${input.kind} enquiry failed`, err);
  }

  let sent = false;
  try {
    await sendNotificationEmail(email);
    sent = true;
  } catch (err) {
    console.error(`${input.kind} notification email failed`, err);
  }

  if (savedId && sent) {
    try {
      await markEnquiryEmailSent(savedId);
    } catch (err) {
      // The enquiry itself is saved; only the notified flag is stale.
      console.error(`Marking enquiry ${savedId} as emailed failed`, err);
    }
  }

  return Boolean(savedId) || sent;
}
