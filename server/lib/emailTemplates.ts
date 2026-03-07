interface WelcomeEmailParams {
  name: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export function buildWelcomeEmail({ name, email, tempPassword, loginUrl }: WelcomeEmailParams) {
  const subject = `${name}, your Syllabind account is ready`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Syllabind Account</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px; text-align:center;">
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:600; color:#18181b;">Welcome to Syllabind</h1>
              <p style="margin:0; font-size:15px; color:#71717a;">Your learning journey starts here</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 16px; font-size:15px; color:#3f3f46;">Hi ${name},</p>
              <p style="margin:0 0 16px; font-size:15px; color:#3f3f46;">We've set up your Syllabind account. You can log in with the details below:</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5; border-radius:8px; margin-bottom:16px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px; font-size:14px; color:#71717a;">Email</p>
                    <p style="margin:0 0 12px; font-size:15px; color:#18181b; font-weight:500;">${email}</p>
                    <p style="margin:0 0 8px; font-size:14px; color:#71717a;">One-time code</p>
                    <p style="margin:0; font-size:15px; color:#18181b; font-family:monospace; font-weight:500;">${tempPassword}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px; font-size:14px; color:#71717a;">You'll choose your own password the first time you sign in.</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block; padding:12px 32px; background-color:#18181b; color:#ffffff; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">Sign in to Syllabind</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #e4e4e7; text-align:center;">
              <p style="margin:0; font-size:13px; color:#a1a1aa;">Syllabind &mdash; Curated learning, structured for you.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `Hi ${name},

We've set up your Syllabind account. You can log in with the details below:

Email: ${email}
One-time code: ${tempPassword}

You'll choose your own password the first time you sign in.

Sign in at: ${loginUrl}

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
  <title>Reset Your Password</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px; text-align:center;">
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:600; color:#18181b;">Reset your password</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 16px; font-size:15px; color:#3f3f46;">Hi ${name},</p>
              <p style="margin:0 0 24px; font-size:15px; color:#3f3f46;">We received a request to reset your Syllabind password. Click the button below to choose a new one:</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block; padding:12px 32px; background-color:#18181b; color:#ffffff; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">Reset password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0; font-size:14px; color:#71717a;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #e4e4e7; text-align:center;">
              <p style="margin:0; font-size:13px; color:#a1a1aa;">Syllabind &mdash; Curated learning, structured for you.</p>
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
