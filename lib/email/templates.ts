// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin: 0; padding: 0; background: #f8f7f4; font-family: 'DM Sans', Arial, sans-serif; color: #1a1a22; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; border: 1px solid #e5e0d8; overflow: hidden; }
  .header { background: #1a1a22; padding: 28px 32px; }
  .header h1 { margin: 0; font-size: 18px; font-weight: 400; letter-spacing: 0.12em; color: #fff; text-transform: uppercase; }
  .header span { color: #2a7a8a; }
  .body { padding: 32px; }
  .body p { margin: 0 0 16px; line-height: 1.6; font-size: 15px; color: #3a3a4a; }
  .body p:last-child { margin-bottom: 0; }
  .btn { display: inline-block; margin: 8px 0; padding: 12px 24px; background: #2a7a8a; color: #fff !important; text-decoration: none; border-radius: 4px; font-size: 14px; letter-spacing: 0.08em; }
  .divider { height: 1px; background: #e5e0d8; margin: 24px 0; }
  .meta { font-size: 13px; color: #888a96; }
  .footer { padding: 20px 32px; border-top: 1px solid #e5e0d8; font-size: 12px; color: #888a96; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>Vita<span>Re</span>Ba</h1></div>
  <div class="body">${body}</div>
  <div class="footer">VitaReBa GmbH · Zürich · <a href="https://vitareba.ch" style="color:#2a7a8a">vitareba.ch</a></div>
</div>
</body>
</html>`;
}

// ─── Booking: notification to admin ───────────────────────────────────────────

export function bookingRequestAdminEmail({
  patientName,
  patientEmail,
  notes,
  preferredDate,
  adminUrl,
}: {
  patientName: string;
  patientEmail: string;
  notes?: string | null;
  preferredDate?: string | null;
  adminUrl: string;
}) {
  return layout(`
    <p>A new consultation request has been submitted.</p>
    <div class="divider"></div>
    <p class="meta"><strong>Patient:</strong> ${patientName} (${patientEmail})</p>
    ${preferredDate ? `<p class="meta"><strong>Preferred date:</strong> ${preferredDate}</p>` : ""}
    ${notes ? `<p class="meta"><strong>Notes:</strong> ${notes}</p>` : ""}
    <div class="divider"></div>
    <p><a class="btn" href="${adminUrl}">Review in Admin Portal</a></p>
  `);
}

// ─── Booking: confirmation to patient ─────────────────────────────────────────

export function bookingConfirmedEmail({
  patientName,
  portalUrl,
}: {
  patientName: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${patientName},</p>
    <p>Your consultation request has been <strong>confirmed</strong>. We will be in touch shortly with the details.</p>
    <p>In the meantime, you can view all your bookings in your patient portal.</p>
    <p><a class="btn" href="${portalUrl}">View your bookings</a></p>
  `);
}

// ─── Booking: cancellation to patient ─────────────────────────────────────────

export function bookingCancelledEmail({
  patientName,
  portalUrl,
}: {
  patientName: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${patientName},</p>
    <p>Your consultation request has been cancelled. If you have any questions, please reply to this email or send us a message through the portal.</p>
    <p><a class="btn" href="${portalUrl}">Open patient portal</a></p>
  `);
}

// ─── Password reset ────────────────────────────────────────────────────────────

export function passwordResetEmail({
  resetUrl,
}: {
  resetUrl: string;
}) {
  return layout(`
    <p>You requested a password reset for your VitaReBa account.</p>
    <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
    <p><a class="btn" href="${resetUrl}">Reset password</a></p>
    <div class="divider"></div>
    <p class="meta">If you did not request this, you can safely ignore this email.</p>
  `);
}

// ─── New message notification ─────────────────────────────────────────────────

export function newMessageEmail({
  recipientName,
  senderName,
  subject,
  portalUrl,
}: {
  recipientName: string;
  senderName: string;
  subject: string;
  portalUrl: string;
}) {
  return layout(`
    <p>Hi ${recipientName},</p>
    <p>You have a new message from <strong>${senderName}</strong> regarding: <em>${subject}</em></p>
    <p><a class="btn" href="${portalUrl}">Read message</a></p>
  `);
}
