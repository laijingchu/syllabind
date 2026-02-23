import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { ArrowLeft, Crown } from 'lucide-react';
import { redirectToCheckout, redirectToPortal } from '@/lib/stripe';

export default function Billing() {
  const { user, isPro, refreshSubscriptionLimits } = useStore();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle ?subscription=success query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      toast({ title: 'Welcome to Syllabind Pro!', description: 'Your subscription is now active.' });
      refreshSubscriptionLimits();
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  if (!user) {
    return <div className="container mx-auto py-10">Please log in to view billing.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/">
          <Button variant="ghost" className="pl-0 mb-4 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-medium mb-2">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Subscription
            </CardTitle>
            {isPro && <Badge className="bg-primary text-primary-foreground">Pro</Badge>}
          </div>
          <CardDescription>
            {isPro
              ? 'You have Syllabind Pro access.'
              : 'Upgrade to Syllabind Pro for unlimited creation and enrollment.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <Button
              variant="outline"
              onClick={async () => {
                setPortalLoading(true);
                try { await redirectToPortal(); } catch (e) { setPortalLoading(false); toast({ title: 'Unable to open billing portal', description: e instanceof Error ? e.message : 'Please try again later.', variant: 'destructive' }); }
              }}
              disabled={portalLoading}
            >
              {portalLoading ? 'Redirecting...' : 'Manage Billing'}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                <strong>$9.99 one-time</strong> — Unlimited syllabinds, enroll in any course, full progress tracking.
              </p>
              <Button
                onClick={async () => {
                  try { await redirectToCheckout('/billing'); } catch (e) { toast({ title: 'Unable to start checkout', description: e instanceof Error ? e.message : 'Please try again later.', variant: 'destructive' }); }
                }}
              >
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
