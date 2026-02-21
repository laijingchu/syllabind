import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Settings } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminSettings() {
  const { user } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [slackUrl, setSlackUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Fetch current setting
  useEffect(() => {
    fetch('/api/site-settings/slack_community_url')
      .then(res => res.json())
      .then(data => {
        setSlackUrl(data.value || '');
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
          <CardTitle>Slack Community</CardTitle>
          <CardDescription>
            The Slack invite URL shown to Pro users on syllabind overview pages.
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
    </div>
  );
}
