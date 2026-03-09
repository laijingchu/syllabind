import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, Mail, Settings, UserPlus } from 'lucide-react';
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
  const [feedbackUrlGeneral, setFeedbackUrlGeneral] = useState('');
  const [feedbackUrlLearners, setFeedbackUrlLearners] = useState('');
  const [feedbackUrlCurators, setFeedbackUrlCurators] = useState('');
  const [curatorLearnMoreUrl, setCuratorLearnMoreUrl] = useState('');
  const [wipBadgeUrl, setWipBadgeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [waitlistSaving, setWaitlistSaving] = useState(false);
  const [bugReportSaving, setBugReportSaving] = useState(false);
  const [termsSaving, setTermsSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [feedbackGeneralSaving, setFeedbackGeneralSaving] = useState(false);
  const [feedbackLearnersSaving, setFeedbackLearnersSaving] = useState(false);
  const [feedbackCuratorsSaving, setFeedbackCuratorsSaving] = useState(false);
  const [curatorLearnMoreSaving, setCuratorLearnMoreSaving] = useState(false);
  const [wipBadgeSaving, setWipBadgeSaving] = useState(false);

  // Create User state
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<'reader' | 'curator'>('reader');
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
      fetch('/api/site-settings/feedback_url_general').then(r => r.json()),
      fetch('/api/site-settings/feedback_url_learners').then(r => r.json()),
      fetch('/api/site-settings/feedback_url_curators').then(r => r.json()),
      fetch('/api/site-settings/curator_learn_more_url').then(r => r.json()),
      fetch('/api/site-settings/wip_badge_url').then(r => r.json()),
    ])
      .then(([slackData, waitlistData, bugReportData, termsData, privacyData, feedbackGeneralData, feedbackLearnersData, feedbackCuratorsData, curatorLearnMoreData, wipBadgeData]) => {
        setSlackUrl(slackData.value || '');
        setWaitlistUrl(waitlistData.value || '');
        setBugReportUrl(bugReportData.value || '');
        setTermsUrl(termsData.value || '');
        setPrivacyUrl(privacyData.value || '');
        setFeedbackUrlGeneral(feedbackGeneralData.value || '#feedback_general');
        setFeedbackUrlLearners(feedbackLearnersData.value || '#feedback_reader');
        setFeedbackUrlCurators(feedbackCuratorsData.value || '#feedback_curator');
        setCuratorLearnMoreUrl(curatorLearnMoreData.value || '#learnmore_curator');
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

  const handleFeedbackSave = async (type: 'general' | 'learners' | 'curators') => {
    const keyMap = { general: 'feedback_url_general', learners: 'feedback_url_learners', curators: 'feedback_url_curators' };
    const valueMap = { general: feedbackUrlGeneral, learners: feedbackUrlLearners, curators: feedbackUrlCurators };
    const setterMap = { general: setFeedbackGeneralSaving, learners: setFeedbackLearnersSaving, curators: setFeedbackCuratorsSaving };
    const savingMap = { general: feedbackGeneralSaving, learners: feedbackLearnersSaving, curators: feedbackCuratorsSaving };

    setterMap[type](true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: keyMap[type], value: valueMap[type] }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', description: `Feedback URL (${type}) has been updated.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setterMap[type](false);
    }
  };

  const handleCuratorLearnMoreSave = async () => {
    setCuratorLearnMoreSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'curator_learn_more_url', value: curatorLearnMoreUrl }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Settings saved', description: 'Curator Learn More URL has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setCuratorLearnMoreSaving(false);
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
    <div className="max-w-page-prose mx-auto space-y-6">
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
        <Link href="/admin/emails">
          <Button variant="secondary" size="sm" className="mt-3">
            <Mail className="mr-2 h-4 w-4" />
            Email Previews
          </Button>
        </Link>
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
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              placeholder="jane@example.com"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <RadioGroup value={createRole} onValueChange={(v) => setCreateRole(v as 'reader' | 'curator')} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="reader" id="role-reader" />
                <Label htmlFor="role-reader" className="font-normal cursor-pointer">Reader</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="curator" id="role-curator" />
                <Label htmlFor="role-curator" className="font-normal cursor-pointer">Curator</Label>
              </div>
            </RadioGroup>
          </div>
          <Button
            onClick={async () => {
              if (!createEmail.trim()) {
                toast({ title: 'Error', description: 'Email is required.', variant: 'destructive' });
                return;
              }
              setCreating(true);
              try {
                const res = await fetch('/api/admin/create-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ email: createEmail.trim(), role: createRole }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to create user');
                toast({
                  title: data.resent ? 'Welcome email resent' : 'Account created',
                  description: `Username: ${data.username}. ${data.emailSent ? 'Welcome email sent.' : 'Email could not be sent — share credentials manually.'}`,
                });
                setCreateEmail('');
                setCreateRole('reader');
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
          <CardTitle>Feedback URL — General</CardTitle>
          <CardDescription>
            Feedback form for website visitors (e.g. Marketing page hero section).
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
                placeholder="https://example.com/feedback"
                value={feedbackUrlGeneral}
                onChange={(e) => setFeedbackUrlGeneral(e.target.value)}
              />
              <Button onClick={() => handleFeedbackSave('general')} disabled={feedbackGeneralSaving}>
                {feedbackGeneralSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback URL — Learners</CardTitle>
          <CardDescription>
            Feedback form shown on the learner dashboard sidebar card.
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
                placeholder="https://example.com/feedback-learners"
                value={feedbackUrlLearners}
                onChange={(e) => setFeedbackUrlLearners(e.target.value)}
              />
              <Button onClick={() => handleFeedbackSave('learners')} disabled={feedbackLearnersSaving}>
                {feedbackLearnersSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback URL — Curators</CardTitle>
          <CardDescription>
            Feedback form for curators.
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
                placeholder="https://example.com/feedback-curators"
                value={feedbackUrlCurators}
                onChange={(e) => setFeedbackUrlCurators(e.target.value)}
              />
              <Button onClick={() => handleFeedbackSave('curators')} disabled={feedbackCuratorsSaving}>
                {feedbackCuratorsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curator Recruitment — Learn More URL</CardTitle>
          <CardDescription>
            URL for the "Learn More" button on the Become a Curator card shown on the reader dashboard.
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
                placeholder="https://example.com/become-a-curator"
                value={curatorLearnMoreUrl}
                onChange={(e) => setCuratorLearnMoreUrl(e.target.value)}
              />
              <Button onClick={handleCuratorLearnMoreSave} disabled={curatorLearnMoreSaving}>
                {curatorLearnMoreSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
