import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Coins, Zap } from 'lucide-react';
import { redirectToCheckout, type CheckoutPlan } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Link } from 'wouter';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: 'curator-limit' | 'enrollment-gate' | 'pro-feature' | 'insufficient-credits' | 'featured-listing';
  returnTo?: string;
  creditCost?: number;
}

export function UpgradePrompt({ open, onOpenChange, variant, returnTo, creditCost }: UpgradePromptProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [termsUrl, setTermsUrl] = useState<string | null>(null);
  const [privacyUrl, setPrivacyUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { isPro, creditBalance } = useStore();

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch('/api/site-settings/terms_of_service_url').then(r => r.json()),
      fetch('/api/site-settings/privacy_policy_url').then(r => r.json()),
    ])
      .then(([termsData, privacyData]) => {
        setTermsUrl(termsData.value || null);
        setPrivacyUrl(privacyData.value || null);
      })
      .catch(() => {});
  }, [open]);

  const handleUpgrade = async (plan: CheckoutPlan) => {
    setLoading(plan);
    try {
      await redirectToCheckout(returnTo || window.location.pathname + window.location.search, plan);
    } catch (error) {
      setLoading(null);
      toast({
        title: 'Unable to start checkout',
        description: error instanceof Error ? error.message : 'Payment service is unavailable. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  // Insufficient credits variant for Pro users
  if (variant === 'insufficient-credits' && isPro) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-warning-surface p-2 rounded-full">
                <Coins className="h-5 w-5 text-warning" />
              </div>
            </div>
            <DialogTitle>Need More Credits</DialogTitle>
            <DialogDescription>
              {creditCost
                ? `This action costs ${creditCost} credits. You have ${creditBalance} credits remaining.`
                : `You've run out of credits. Purchase a credit package to continue.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              className="w-full justify-between"
              variant="secondary"
              onClick={() => handleUpgrade('credits_100')}
              disabled={loading !== null}
            >
              <span>100 credits</span>
              <span className="font-semibold">{loading === 'credits_100' ? 'Redirecting...' : '$4.99'}</span>
            </Button>
            <Button
              className="w-full justify-between"
              variant="secondary"
              onClick={() => handleUpgrade('credits_250')}
              disabled={loading !== null}
            >
              <span>250 credits</span>
              <span className="font-semibold">{loading === 'credits_250' ? 'Redirecting...' : '$9.99'}</span>
            </Button>
            <Button
              className="w-full justify-between"
              variant="secondary"
              onClick={() => handleUpgrade('credits_550')}
              disabled={loading !== null}
            >
              <span>550 credits</span>
              <span className="font-semibold">{loading === 'credits_550' ? 'Redirecting...' : '$19.99'}</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading !== null}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Insufficient credits variant for free users — needs upgrade
  if (variant === 'insufficient-credits') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-warning-surface p-2 rounded-full">
                <Coins className="h-5 w-5 text-warning" />
              </div>
            </div>
            <DialogTitle>Out of Credits</DialogTitle>
            <DialogDescription>
              {creditCost
                ? `This action costs ${creditCost} credits. You have ${creditBalance} credits remaining.`
                : `You've used all your free credits.`}
              {' '}Upgrade to Pro for 130 monthly credits and the ability to purchase more.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => handleUpgrade('pro_annual')} disabled={loading !== null}>
              <Zap className="h-4 w-4 mr-2" />
              {loading === 'pro_annual' ? 'Redirecting...' : 'Annual — $12.50/mo (save 17%)'}
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => handleUpgrade('pro_monthly')} disabled={loading !== null}>
              {loading === 'pro_monthly' ? 'Redirecting...' : 'Monthly — $14.99/mo'}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/pricing" className="underline hover:text-foreground transition-colors">See all plans</Link>
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading !== null}>
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Standard upgrade prompt for curator-limit, enrollment-gate, pro-feature, featured-listing
  const title = variant === 'curator-limit'
    ? 'Upgrade to Syllabind Pro'
    : variant === 'featured-listing'
    ? 'Get Featured in the Catalog'
    : variant === 'pro-feature'
    ? 'Unlock Pro Features'
    : 'Syllabind Pro Required';

  const description = variant === 'enrollment-gate'
    ? 'Free plan allows 1 active enrollment. Upgrade to Pro for unlimited enrollments and 130 monthly credits.'
    : variant === 'featured-listing'
    ? 'Featured binders appear in the public catalog for all readers to discover. An admin reviews your submission to ensure quality — well-structured weeks, thoughtful content, and a clear learning outcome. Upgrade to Pro to submit your binder for featured listing.'
    : 'Upgrade to Pro for unlimited binders, enrollments, and 130 monthly AI credits.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-highlight p-2 rounded-full">
              <Crown className="h-5 w-5 text-primary" />
            </div>
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg p-4 bg-muted space-y-2">
          <p className="font-medium text-sm">Syllabind Pro includes:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>- 130 AI credits per month</li>
            <li>- Unlimited binder creation</li>
            <li>- Unlimited enrollments</li>
            <li>- Up to 6-week AI-generated binders</li>
            <li>- Public binder submission</li>
            <li>- Purchasable credit packages</li>
          </ul>
        </div>
        <div className="space-y-2">
          <Button className="w-full" onClick={() => handleUpgrade('pro_annual')} disabled={loading !== null}>
            {loading === 'pro_annual' ? 'Redirecting...' : 'Annual — $12.50/mo (save 17%)'}
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => handleUpgrade('pro_monthly')} disabled={loading !== null}>
            {loading === 'pro_monthly' ? 'Redirecting...' : 'Monthly — $14.99/mo'}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/pricing" className="underline hover:text-foreground transition-colors">See all plans</Link>
        </p>
        {(termsUrl || privacyUrl) && (
          <p className="upgrade-legal text-center text-xs text-muted-foreground">
            By upgrading, you agree to our{' '}
            {termsUrl && <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Terms of Service</a>}
            {termsUrl && privacyUrl && ' and '}
            {privacyUrl && <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Privacy Policy</a>}.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
