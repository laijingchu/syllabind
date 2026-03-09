import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

interface EmailPreview {
  id: string;
  label: string;
  description: string;
  recipient: string;
  subject: string;
  html: string;
}

const schedulingHint = '<p style="margin:0 0 24px; font-size:14px; color:#6b6560;">&#128197; If you\'ve added a scheduling link to your profile, readers can now book paid sessions with you through your binder page. &#128176; You can set your own rate on your scheduling platform.</p>';

const previews: EmailPreview[] = [
  {
    id: 'welcome',
    label: 'Welcome Email',
    description: 'Sent to newly created users with a temporary password.',
    recipient: 'New user',
    subject: 'Your Syllabind account is ready',
    html: buildWelcomeHtml(),
  },
  {
    id: 'password-reset',
    label: 'Password Reset',
    description: 'Sent when a user requests a password reset.',
    recipient: 'User',
    subject: 'Reset your Syllabind password',
    html: buildPasswordResetHtml(),
  },
  {
    id: 'submitted',
    label: 'Binder Submitted',
    description: 'Sent to admins when a curator submits a binder for review.',
    recipient: 'Admin',
    subject: 'New binder submitted for review: Digital Minimalism',
    html: buildSubmittedHtml(),
  },
  {
    id: 'approved',
    label: 'Binder Approved',
    description: 'Sent to the curator when their binder is approved.',
    recipient: 'Curator',
    subject: 'Your binder "Digital Minimalism" has been approved!',
    html: buildApprovedHtml(),
  },
  {
    id: 'approved-note',
    label: 'Binder Approved (with note)',
    description: 'Sent to the curator when their binder is approved with a reviewer note.',
    recipient: 'Curator',
    subject: 'Your binder "Digital Minimalism" has been approved!',
    html: buildApprovedWithNoteHtml(),
  },
  {
    id: 'rejected',
    label: 'Binder Feedback',
    description: 'Sent to the curator when their binder needs changes before publishing.',
    recipient: 'Curator',
    subject: 'Feedback on your binder "Digital Minimalism"',
    html: buildRejectedHtml(),
  },
];

export default function AdminEmailPreviews() {
  const { user } = useStore();
  const [, setLocation] = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation('/');
    }
  }, [user, setLocation]);

  if (!user?.isAdmin) return null;

  const active = previews[activeIndex];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/admin/settings">
          <Button variant="ghost" className="pl-0 mb-4 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Admin Settings
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-medium mb-2 flex items-center gap-3">
          <Mail className="h-7 w-7" />
          Email Previews
        </h1>
        <p className="text-muted-foreground">Preview all transactional emails sent by the platform.</p>
      </div>

      {/* Email selector tabs */}
      <div className="flex flex-wrap gap-2">
        {previews.map((p, i) => (
          <Pill
            key={p.id}
            active={i === activeIndex}
            onClick={() => setActiveIndex(i)}
          >
            {p.label}
          </Pill>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{active.label}</CardTitle>
              <CardDescription>{active.description}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setActiveIndex(Math.min(previews.length - 1, activeIndex + 1))}
                disabled={activeIndex === previews.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span><strong>To:</strong> {active.recipient}</span>
            <span><strong>Subject:</strong> {active.subject}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-[#faf9f6]">
            <iframe
              srcDoc={active.html}
              className="w-full border-0"
              style={{ height: '520px' }}
              title={`Email preview: ${active.label}`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Static HTML builders (sample data, client-side only) ----

function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600&family=Plus+Jakarta+Sans:wght@400;500&display=swap" rel="stylesheet">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#faf9f6; font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          ${body}
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
</html>`;
}

function heading(h1: string, sub?: string): string {
  return `<tr>
  <td style="padding:32px 32px 24px; text-align:center;">
    <h1 style="margin:0 0 8px; font-size:24px; font-weight:600; color:#0f0c09; font-family:'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;">${h1}</h1>
    ${sub ? `<p style="margin:0; font-size:15px; color:#6b6560;">${sub}</p>` : ''}
  </td>
</tr>`;
}

function cta(label: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center">
      <a href="#" style="display:inline-block; padding:12px 32px; background-color:#0f0c09; color:#faf9f6; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">${label}</a>
    </td>
  </tr>
</table>`;
}

function greyBox(content: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#faf9f6; border-radius:8px; margin-bottom:16px;">
  <tr>
    <td style="padding:16px;">
      ${content}
    </td>
  </tr>
</table>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px; font-size:15px; color:#4a4541;">${text}</p>`;
}

function buildWelcomeHtml(): string {
  return emailShell('Your Syllabind Account', `
    ${heading('Welcome to Syllabind', 'Your learning journey starts here')}
    <tr><td style="padding:0 32px 24px;">
      ${p('Hi there,')}
      ${p("We've set up your Syllabind account. You can log in with the details below:")}
      ${greyBox(`
        <p style="margin:0 0 8px; font-size:14px; color:#6b6560;">Email</p>
        <p style="margin:0 0 12px; font-size:15px; color:#0f0c09; font-weight:500;">jane@example.com</p>
        <p style="margin:0 0 8px; font-size:14px; color:#6b6560;">One-time code</p>
        <p style="margin:0; font-size:15px; color:#0f0c09; font-family:monospace; font-weight:500;">aB3kQ9xZ</p>
      `)}
      <p style="margin:0 0 24px; font-size:14px; color:#6b6560;">You'll choose your own password the first time you sign in.</p>
      ${cta('Sign in to Syllabind')}
    </td></tr>
  `);
}

function buildPasswordResetHtml(): string {
  return emailShell('Reset Your Password', `
    ${heading('Reset your password')}
    <tr><td style="padding:0 32px 24px;">
      ${p('Hi Jane,')}
      ${p('We received a request to reset your Syllabind password. Click the button below to choose a new one:')}
      ${cta('Reset password')}
      <p style="margin:24px 0 0; font-size:14px; color:#6b6560;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </td></tr>
  `);
}

function buildSubmittedHtml(): string {
  return emailShell('Binder Submitted for Review', `
    ${heading('New Binder for Review', 'A curator has submitted a binder for your approval')}
    <tr><td style="padding:0 32px 24px;">
      ${greyBox(`
        <p style="margin:0 0 8px; font-size:14px; color:#6b6560;">Binder</p>
        <p style="margin:0 0 12px; font-size:15px; color:#0f0c09; font-weight:500;">Digital Minimalism: A 4-Week Guide</p>
        <p style="margin:0 0 8px; font-size:14px; color:#6b6560;">Submitted by</p>
        <p style="margin:0; font-size:15px; color:#0f0c09; font-weight:500;">Jane Smith</p>
      `)}
      ${cta('Review binder')}
    </td></tr>
  `);
}

function buildApprovedHtml(): string {
  return emailShell('Binder Approved', `
    ${heading('Binder Approved', 'Your binder is now live on Syllabind')}
    <tr><td style="padding:0 32px 24px;">
      ${p('Hi Jane,')}
      ${p('Great news! Your binder <strong>Digital Minimalism: A 4-Week Guide</strong> has been reviewed and approved. It\'s now published and visible in the catalog.')}
      ${schedulingHint}
      ${cta('View your binder')}
    </td></tr>
  `);
}

function buildApprovedWithNoteHtml(): string {
  return emailShell('Binder Approved', `
    ${heading('Binder Approved', 'Your binder is now live on Syllabind')}
    <tr><td style="padding:0 32px 24px;">
      ${p('Hi Jane,')}
      ${p('Great news! Your binder <strong>Digital Minimalism: A 4-Week Guide</strong> has been reviewed and approved. It\'s now published and visible in the catalog.')}
      ${greyBox(`
        <p style="margin:0 0 8px; font-size:14px; color:#6b6560;">Note from reviewer</p>
        <p style="margin:0; font-size:15px; color:#4a4541;">Great content! Consider adding a few more exercises in Week 3.</p>
      `)}
      ${schedulingHint}
      ${cta('View your binder')}
    </td></tr>
  `);
}

function buildRejectedHtml(): string {
  return emailShell('Binder Feedback', `
    ${heading('Binder Feedback', 'Your binder needs a few changes before publishing')}
    <tr><td style="padding:0 32px 24px;">
      ${p('Hi Jane,')}
      ${p('We\'ve reviewed your binder <strong>Digital Minimalism: A 4-Week Guide</strong> and have some feedback for you:')}
      ${greyBox(`
        <p style="margin:0; font-size:15px; color:#4a4541;">The binder looks promising, but Week 2 is missing reading links and the description could use more detail about what readers will learn. Please also check the broken link in Step 3 of Week 1.</p>
      `)}
      ${p("Once you've made the changes, you can resubmit your binder for review.")}
      ${cta('Edit your binder')}
    </td></tr>
  `);
}
