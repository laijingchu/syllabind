import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { ArrowLeft, Crown, Coins, Shield, Zap } from 'lucide-react';
import { redirectToCheckout, redirectToPortal, type CheckoutPlan } from '@/lib/stripe';
import { CreditTransaction } from '@/lib/types';

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro_monthly: 'Pro Monthly',
  pro_annual: 'Pro Annual',
  lifetime: 'Founding Member (Lifetime)',
};

export default function Billing() {
  const { user, isPro, creditBalance, subscriptionTier, refreshSubscriptionLimits, refreshCredits } = useStore();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Refresh credits on mount so balance is always current
  useEffect(() => {
    refreshCredits();
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      toast({ title: 'Welcome to Syllabind Pro!', description: 'Your subscription is now active.' });
      refreshSubscriptionLimits();
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  // Fetch transaction history
  useEffect(() => {
    if (!user) return;
    setTxLoading(true);
    fetch('/api/credits/history?limit=20', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setTransactions(data.transactions || []))
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, [user]);

  if (!user) {
    return <div className="py-10">Please log in to view billing.</div>;
  }

  const isAdmin = user.isAdmin === true;
  const tierLabel = isAdmin ? 'Admin Access' : TIER_LABELS[subscriptionTier] || 'Free';

  const handleCheckout = async (plan: CheckoutPlan) => {
    setCheckoutLoading(plan);
    try {
      await redirectToCheckout('/billing', plan);
    } catch (e) {
      setCheckoutLoading(null);
      toast({ title: 'Unable to start checkout', description: e instanceof Error ? e.message : 'Please try again later.', variant: 'destructive' });
    }
  };

  return (
    <div className="grid-12">
    <div className="col-span-12 md:col-span-8 md:col-start-3 space-y-6">
      <div>
        <Link href="/">
          <Button variant="ghost" className="pl-0 mb-4 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-medium mb-2">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and credits.</p>
      </div>

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isAdmin ? <Shield className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
              Subscription
            </CardTitle>
            <Badge className={isPro || isAdmin ? 'bg-primary-inverted text-foreground-inverted' : 'bg-muted text-muted-foreground'}>
              {tierLabel}
            </Badge>
          </div>
          <CardDescription>
            {isAdmin
              ? 'Admin users have unlimited access to all features.'
              : isPro
              ? 'You have Syllabind Pro access.'
              : 'Upgrade to Pro for unlimited creation, enrollment, and monthly credits.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPro && !isAdmin ? (
            <Button
              variant="secondary"
              onClick={async () => {
                setPortalLoading(true);
                try { await redirectToPortal(); } catch (e) { setPortalLoading(false); toast({ title: 'Unable to open billing portal', variant: 'destructive' }); }
              }}
              disabled={portalLoading}
            >
              {portalLoading ? 'Redirecting...' : 'Manage Billing'}
            </Button>
          ) : !isAdmin ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Button className="w-full" onClick={() => handleCheckout('pro_annual')} disabled={checkoutLoading !== null}>
                  <Zap className="mr-2 h-4 w-4" />
                  {checkoutLoading === 'pro_annual' ? 'Redirecting...' : 'Annual — $12.50/mo (save 17%)'}
                </Button>
                <Button className="w-full" variant="secondary" onClick={() => handleCheckout('pro_monthly')} disabled={checkoutLoading !== null}>
                  {checkoutLoading === 'pro_monthly' ? 'Redirecting...' : 'Monthly — $14.99/mo'}
                </Button>
                <Button className="w-full" variant="secondary" onClick={() => handleCheckout('lifetime')} disabled={checkoutLoading !== null}>
                  {checkoutLoading === 'lifetime' ? 'Redirecting...' : 'Founding Member — $500 (lifetime)'}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/pricing" className="underline hover:text-foreground transition-colors">Compare all plans</Link>
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Credit Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Credits
            </CardTitle>
            <span className="text-2xl font-semibold">{isAdmin ? '∞' : creditBalance}</span>
          </div>
          <CardDescription>
            {isAdmin
              ? 'Admin users have unlimited credits.'
              : `Credits are used for AI features like binder generation and writing improvement.`}
          </CardDescription>
        </CardHeader>
        {isPro && !isAdmin && (
          <CardContent>
            <p className="text-sm font-medium mb-3">Buy more credits:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleCheckout('credits_100')} disabled={checkoutLoading !== null}>
                100 — $4.99
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleCheckout('credits_250')} disabled={checkoutLoading !== null}>
                250 — $9.99
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleCheckout('credits_550')} disabled={checkoutLoading !== null}>
                550 — $19.99
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Transaction History */}
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Credit History</CardTitle>
            <CardDescription>Recent credit transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-sm font-medium ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </div>
  );
}
