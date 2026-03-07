import { BrevoClient } from '@getbrevo/brevo';

let client: BrevoClient | null = null;
let configuredApiKey: string | null = null;

function getClient(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    configuredApiKey = null;
    client = null;
    return null;
  }

  if (configuredApiKey !== apiKey) {
    client = new BrevoClient({ apiKey });
    configuredApiKey = apiKey;
  }

  return client;
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const brevo = getClient();
    if (!brevo) {
      console.warn('[Brevo] BREVO_API_KEY not configured; skipping email send.');
      return false;
    }

    await brevo.transactionalEmails.sendTransacEmail({
      sender: { email: params.from },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
    });

    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}
