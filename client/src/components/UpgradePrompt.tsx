import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { redirectToCheckout } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: 'creator-limit' | 'enrollment-gate' | 'pro-feature';
  returnTo?: string;
}

export function UpgradePrompt({ open, onOpenChange, variant, returnTo }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);
  const [termsUrl, setTermsUrl] = useState<string | null>(null);
  const [privacyUrl, setPrivacyUrl] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await redirectToCheckout(returnTo || window.location.pathname + window.location.search);
    } catch (error) {
      setLoading(false);
      toast({
        title: 'Unable to start checkout',
        description: error instanceof Error ? error.message : 'Payment service is unavailable. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const title = variant === 'creator-limit'
    ? 'Upgrade to Syllabind Pro'
    : variant === 'pro-feature'
    ? 'Unlock Pro Features'
    : 'Syllabind Pro Required';

  const description = 'To continue, we will charge you $9.99 for one month usage — no autorenewal.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Crown className="h-5 w-5 text-primary" />
            </div>
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <p className="font-medium text-sm">Syllabind Pro includes:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>- Unlimited syllabind creation</li>
            <li>- Enroll in any syllabind</li>
            <li>- Full progress tracking</li>
            <li>- Book calls with creators</li>
            <li>- Join the Syllabind Slack community</li>
          </ul>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading ? 'Redirecting...' : 'Upgrade to Pro — $9.99'}
          </Button>
        </DialogFooter>
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
