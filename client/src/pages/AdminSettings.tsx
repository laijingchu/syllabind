import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Settings, UserPlus } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminSettings() {
  const { user } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [slackUrl, setSlackUrl] = useState('');
  const [waitlistUrl, setWaitlistUrl] = useState('');
  const [bugReportUrl, setBugReportUrl] = useState('');
  const [termsUrl, setTermsUrl] = useState('');
  const [privacyUrl, setPrivacyUrl] = useState('');
  const [getPaidToTeachUrl, setGetPaidToTeachUrl] = useState('');
  const [wipBadgeUrl, setWipBadgeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [waitlistSaving, setWaitlistSaving] = useState(false);
  const [bugReportSaving, setBugReportSaving] = useState(false);
  const [termsSaving, setTermsSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [getPaidToTeachSaving, setGetPaidToTeachSaving] = useState(false);
  const [wipBadgeSaving, setWipBadgeSaving] = useState(false);

  // Create User state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [creating, setCreating] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Fetch current settings
  useEffect(() => {
    Promise.all([
      fetch('/api/site-settings/slack_community_url').then(r => r.json()),
      fetch('/api/site-settings/waitlist_form_url').then(r => r.json()),
      fetch('/api/site-settings/bug_report_url').then(r => r.json()),
      fetch('/api/site-settings/terms_of_service_url').then(r => r.json()),
      fetch('/api/site-settings/privacy_policy_url').then(r => r.json()),
      fetch('/api/site-settings/get_paid_to_teach_url').then(r => r.json()),
      fetch('/api/site-settings/wip_badge_url').then(r => r.json()),
    ])
      .then(([slackData, waitlistData, bugReportData, termsData, privacyData, getPaidToTeachData, wipBadgeData]) => {
        setSlackUrl(slackData.value || '');
        setWaitlistUrl(waitlistData.value || '');
        setBugReportUrl(bugReportData.value || '');
        setTermsUrl(termsData.value || '');
        setPrivacyUrl(privacyData.value || '');
        setGetPaidToTeachUrl(getPaidToTeachData.value || '');
        setWipBadgeUrl(wipBadgeData.value || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'slack_community_url', value: slackUrl }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', description: 'Slack community URL has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleBugReportSave = async () => {
    setBugReportSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'bug_report_url', value: bugReportUrl }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', description: 'Bug report form URL has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setBugReportSaving(false);
    }
  };

  const handleTermsSave = async () => {
    setTermsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'terms_of_service_url', value: termsUrl }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', description: 'Terms of Service URL has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setTermsSaving(false);
    }
  };

  const handlePrivacySave = async () => {
    setPrivacySaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'privacy_policy_url', value: privacyUrl }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', description: 'Privacy Policy URL has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setPrivacySaving(false);
    }
  };

  const handleWaitlistSave = async () => {
    setWaitlistSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'waitlist_form_url', value: waitlistUrl }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', description: 'Waitlist form URL has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setWaitlistSaving(false);
    }
  };

  const handleGetPaidToTeachSave = async () => {
    setGetPaidToTeachSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'get_paid_to_teach_url', value: getPaidToTeachUrl }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', description: 'Get Paid to Teach URL has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setGetPaidToTeachSaving(false);
    }
  };

  const handleWipBadgeSave = async () => {
    setWipBadgeSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'wip_badge_url', value: wipBadgeUrl }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', description: 'WIP badge URL has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setWipBadgeSaving(false);
    }
  };

  if (!user?.isAdmin) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/">
          <Button variant="ghost" className="pl-0 mb-4 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-medium mb-2 flex items-center gap-3">
          <Settings className="h-7 w-7" />
          Admin Settings
        </h1>
        <p className="text-muted-foreground">Configure platform-wide settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create User Account
          </CardTitle>
          <CardDescription>
            Create a new user account and send a welcome email with a temporary password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name</Label>
            <Input
              id="create-name"
              placeholder="Jane Doe"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              placeholder="jane@example.com"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={async () => {
              if (!createName.trim() || !createEmail.trim()) {
                toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive' });
                return;
              }
              setCreating(true);
              try {
                const res = await fetch('/api/admin/create-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ name: createName.trim(), email: createEmail.trim() }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to create user');
                toast({
                  title: data.resent ? 'Welcome email resent' : 'Account created',
                  description: `Username: ${data.username}. ${data.emailSent ? 'Welcome email sent.' : 'Email could not be sent — share credentials manually.'}`,
                });
                setCreateName('');
                setCreateEmail('');
              } catch (err: any) {
                toast({ title: 'Error', description: err.message, variant: 'destructive' });
              } finally {
                setCreating(false);
              }
            }}
            disabled={creating}
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account & Send Email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slack Community</CardTitle>
          <CardDescription>
            The Slack invite URL shown to Pro users on binder overview pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <Input
                placeholder="https://join.slack.com/t/your-workspace/shared_invite/..."
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
              />
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waitlist Form URL</CardTitle>
          <CardDescription>
            External form URL (Google Form, Typeform, etc.) shown on the Login and Marketing pages for waitlist signups.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <Input
                placeholder="https://forms.gle/... or https://yourform.typeform.com/..."
                value={waitlistUrl}
                onChange={(e) => setWaitlistUrl(e.target.value)}
              />
              <Button onClick={handleWaitlistSave} disabled={waitlistSaving}>
                {waitlistSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Give Feedback URL</CardTitle>
          <CardDescription>
            URL for the "Give feedback" button on the Marketing page hero section.
            Leave empty to scroll to the Apply to Curate section instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <Input
                placeholder="https://example.com/teach"
                value={getPaidToTeachUrl}
                onChange={(e) => setGetPaidToTeachUrl(e.target.value)}
              />
              <Button onClick={handleGetPaidToTeachSave} disabled={getPaidToTeachSaving}>
                {getPaidToTeachSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bug Report Form</CardTitle>
          <CardDescription>
            Google Form or other URL for bug reports. When set, a bug icon appears in the header next to the user avatar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <Input
                placeholder="https://forms.gle/... or https://yourform.typeform.com/..."
                value={bugReportUrl}
                onChange={(e) => setBugReportUrl(e.target.value)}
              />
              <Button onClick={handleBugReportSave} disabled={bugReportSaving}>
                {bugReportSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <CardDescription>
            URL for your Terms of Service page. Linked in the footer, login page, and upgrade prompt.
            Leave empty to hide the link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <Input
                placeholder="https://example.com/terms"
                value={termsUrl}
                onChange={(e) => setTermsUrl(e.target.value)}
              />
              <Button onClick={handleTermsSave} disabled={termsSaving}>
                {termsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>
            URL for your Privacy Policy page. Linked in the footer, login page, and upgrade prompt.
            Leave empty to hide the link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <Input
                placeholder="https://example.com/privacy"
                value={privacyUrl}
                onChange={(e) => setPrivacyUrl(e.target.value)}
              />
              <Button onClick={handlePrivacySave} disabled={privacySaving}>
                {privacySaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WIP Badge Link</CardTitle>
          <CardDescription>
            URL opened when users tap the "WIP" badge next to the Syllabind logo in the header.
            Leave empty to make the badge non-clickable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <Input
                placeholder="https://example.com/roadmap"
                value={wipBadgeUrl}
                onChange={(e) => setWipBadgeUrl(e.target.value)}
              />
              <Button onClick={handleWipBadgeSave} disabled={wipBadgeSaving}>
                {wipBadgeSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
