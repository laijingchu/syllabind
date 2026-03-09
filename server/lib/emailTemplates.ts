interface WelcomeEmailParams {
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export function buildWelcomeEmail({ email, tempPassword, loginUrl }: WelcomeEmailParams) {
  const subject = `Your Syllabind account is ready`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600&family=Plus+Jakarta+Sans:wght@400;500&display=swap" rel="stylesheet">
  <title>Your Syllabind Account</title>
</head>
<body style="margin:0; padding:0; background-color:#faf9f6; font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px; text-align:center;">
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:600; color:#0f0c09; font-family:'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;">Welcome to Syllabind</h1>
              <p style="margin:0; font-size:15px; color:#6b6560;">Your learning journey starts here</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 16px; font-size:15px; color:#4a4541;">Hi there,</p>
              <p style="margin:0 0 16px; font-size:15px; color:#4a4541;">We've set up your Syllabind account. You can log in with the details below:</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; border-radius:8px; margin-bottom:16px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px; font-size:14px; color:#6b6560;">Email</p>
                    <p style="margin:0 0 12px; font-size:15px; color:#0f0c09; font-weight:500;">${email}</p>
                    <p style="margin:0 0 8px; font-size:14px; color:#6b6560;">One-time code</p>
                    <p style="margin:0; font-size:15px; color:#0f0c09; font-family:monospace; font-weight:500;">${tempPassword}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px; font-size:14px; color:#6b6560;">You'll choose your own password the first time you sign in.</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block; padding:12px 32px; background-color:#0f0c09; color:#faf9f6; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">Sign in to Syllabind</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #ede9e0; text-align:center;">
              <p style="margin:0; font-size:13px; color:#9b9590;">Syllabind &mdash; Curated learning, structured for you.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `Hi there,

We've set up your Syllabind account. You can log in with the details below:

Email: ${email}
One-time code: ${tempPassword}

You'll choose your own password the first time you sign in.

Sign in at: ${loginUrl}

Syllabind - Curated learning, structured for you.`;

  return { subject, html, text };
}

// ========== BINDER REVIEW EMAIL TEMPLATES ==========

interface BinderSubmittedEmailParams {
  binderTitle: string;
  curatorName: string;
  reviewUrl: string;
}

export function buildBinderSubmittedEmail({ binderTitle, curatorName, reviewUrl }: BinderSubmittedEmailParams) {
  const subject = `New binder submitted for review: ${binderTitle}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600&family=Plus+Jakarta+Sans:wght@400;500&display=swap" rel="stylesheet">
  <title>Binder Submitted for Review</title>
</head>
<body style="margin:0; padding:0; background-color:#faf9f6; font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px; text-align:center;">
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:600; color:#0f0c09; font-family:'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;">New Binder for Review</h1>
              <p style="margin:0; font-size:15px; color:#6b6560;">A curator has submitted a binder for your approval</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; border-radius:8px; margin-bottom:16px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px; font-size:14px; color:#6b6560;">Binder</p>
                    <p style="margin:0 0 12px; font-size:15px; color:#0f0c09; font-weight:500;">${binderTitle}</p>
                    <p style="margin:0 0 8px; font-size:14px; color:#6b6560;">Submitted by</p>
                    <p style="margin:0; font-size:15px; color:#0f0c09; font-weight:500;">${curatorName}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${reviewUrl}" style="display:inline-block; padding:12px 32px; background-color:#0f0c09; color:#faf9f6; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">Review binder</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #ede9e0; text-align:center;">
              <p style="margin:0; font-size:13px; color:#9b9590;">Syllabind &mdash; Curated learning, structured for you.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `New binder submitted for review.

Binder: ${binderTitle}
Submitted by: ${curatorName}

Review it at: ${reviewUrl}

Syllabind - Curated learning, structured for you.`;

  return { subject, html, text };
}

interface BinderApprovedEmailParams {
  binderTitle: string;
  curatorName: string;
  binderUrl: string;
  note?: string | null;
}

export function buildBinderApprovedEmail({ binderTitle, curatorName, binderUrl, note }: BinderApprovedEmailParams) {
  const subject = `Your binder "${binderTitle}" has been approved!`;

  const noteBlock = note
    ? `<p style="margin:0 0 8px; font-size:14px; color:#6b6560;">Note from reviewer</p>
                    <p style="margin:0; font-size:15px; color:#4a4541;">${note}</p>`
    : '';

  const noteTableRow = note
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; border-radius:8px; margin-bottom:16px;">
                <tr>
                  <td style="padding:16px;">
                    ${noteBlock}
                  </td>
                </tr>
              </table>`
    : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600&family=Plus+Jakarta+Sans:wght@400;500&display=swap" rel="stylesheet">
  <title>Binder Approved</title>
</head>
<body style="margin:0; padding:0; background-color:#faf9f6; font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px; text-align:center;">
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:600; color:#0f0c09; font-family:'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;">Binder Approved</h1>
              <p style="margin:0; font-size:15px; color:#6b6560;">Your binder is now live on Syllabind</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 16px; font-size:15px; color:#4a4541;">Hi ${curatorName},</p>
              <p style="margin:0 0 16px; font-size:15px; color:#4a4541;">Great news! Your binder <strong>${binderTitle}</strong> has been reviewed and approved. It's now published and visible in the catalog.</p>
              ${noteTableRow}
              <p style="margin:0 0 24px; font-size:14px; color:#6b6560;">&#128197; If you've added a scheduling link to your profile, readers can now book paid sessions with you through your binder page. &#128176; You can set your own rate on your scheduling platform.</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${binderUrl}" style="display:inline-block; padding:12px 32px; background-color:#0f0c09; color:#faf9f6; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">View your binder</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #ede9e0; text-align:center;">
              <p style="margin:0; font-size:13px; color:#9b9590;">Syllabind &mdash; Curated learning, structured for you.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const noteText = note ? `\nNote from reviewer: ${note}\n` : '';

  const text = `Hi ${curatorName},

Great news! Your binder "${binderTitle}" has been reviewed and approved. It's now published and visible in the catalog.
${noteText}
📅 If you've added a scheduling link to your profile, readers can now book paid sessions with you through your binder page. 💰 You can set your own rate on your scheduling platform.

View it at: ${binderUrl}

Syllabind - Curated learning, structured for you.`;

  return { subject, html, text };
}

interface BinderRejectedEmailParams {
  binderTitle: string;
  curatorName: string;
  reason: string;
  editorUrl: string;
}

export function buildBinderRejectedEmail({ binderTitle, curatorName, reason, editorUrl }: BinderRejectedEmailParams) {
  const subject = `Feedback on your binder "${binderTitle}"`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600&family=Plus+Jakarta+Sans:wght@400;500&display=swap" rel="stylesheet">
  <title>Binder Feedback</title>
</head>
<body style="margin:0; padding:0; background-color:#faf9f6; font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px; text-align:center;">
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:600; color:#0f0c09; font-family:'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;">Binder Feedback</h1>
              <p style="margin:0; font-size:15px; color:#6b6560;">Your binder needs a few changes before publishing</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 16px; font-size:15px; color:#4a4541;">Hi ${curatorName},</p>
              <p style="margin:0 0 16px; font-size:15px; color:#4a4541;">We've reviewed your binder <strong>${binderTitle}</strong> and have some feedback for you:</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; border-radius:8px; margin-bottom:16px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0; font-size:15px; color:#4a4541;">${reason}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px; font-size:15px; color:#4a4541;">Once you've made the changes, you can resubmit your binder for review.</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${editorUrl}" style="display:inline-block; padding:12px 32px; background-color:#0f0c09; color:#faf9f6; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">Edit your binder</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #ede9e0; text-align:center;">
              <p style="margin:0; font-size:13px; color:#9b9590;">Syllabind &mdash; Curated learning, structured for you.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `Hi ${curatorName},

We've reviewed your binder "${binderTitle}" and have some feedback for you:

${reason}

Once you've made the changes, you can resubmit your binder for review.

Edit your binder at: ${editorUrl}

Syllabind - Curated learning, structured for you.`;

  return { subject, html, text };
}

interface PasswordResetEmailParams {
  name: string;
  resetUrl: string;
}

export function buildPasswordResetEmail({ name, resetUrl }: PasswordResetEmailParams) {
  const subject = 'Reset your Syllabind password';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600&family=Plus+Jakarta+Sans:wght@400;500&display=swap" rel="stylesheet">
  <title>Reset Your Password</title>
</head>
<body style="margin:0; padding:0; background-color:#faf9f6; font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px; text-align:center;">
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:600; color:#0f0c09; font-family:'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;">Reset your password</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 16px; font-size:15px; color:#4a4541;">Hi ${name},</p>
              <p style="margin:0 0 24px; font-size:15px; color:#4a4541;">We received a request to reset your Syllabind password. Click the button below to choose a new one:</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block; padding:12px 32px; background-color:#0f0c09; color:#faf9f6; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">Reset password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0; font-size:14px; color:#6b6560;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #ede9e0; text-align:center;">
              <p style="margin:0; font-size:13px; color:#9b9590;">Syllabind &mdash; Curated learning, structured for you.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `Hi ${name},

We received a request to reset your Syllabind password. Visit the link below to choose a new one:

${resetUrl}

This link expires in 1 hour. If you didn't request this, you can safely ignore this email.

Syllabind - Curated learning, structured for you.`;

  return { subject, html, text };
}
