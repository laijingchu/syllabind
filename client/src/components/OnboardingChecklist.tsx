import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, PartyPopper, MessageSquareHeart, ChevronDown, Globe, EyeOff, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'syllabind_onboarding_dismissed';
const BROWSED_KEY = 'syllabind_browsed_binders';
const SHARED_KEY = 'syllabind_shared_with_friend';
const FEATURE_BINDER_KEY = 'syllabind_feature_binder_clicked';

interface ChecklistItem {
  label: string;
  href: string;
  complete: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function FeatureBinderInfoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handleGotIt = () => {
    localStorage.setItem(FEATURE_BINDER_KEY, 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit a Feature Binder</DialogTitle>
          <DialogDescription>
            Featured binders appear in the public catalog for all readers to discover. When your binder is ready, use the Publish dropdown in the binder editor to submit it for review. An admin will check for quality — well-structured weeks, thoughtful content curation, and a clear learning outcome.
          </DialogDescription>
        </DialogHeader>

        {/* Static demo of publish button + dropdown */}
        <div className="border rounded-xl p-6 bg-card shadow-sm space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Binder Editor — Publish Menu</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                Publish <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem className="ring-2 ring-primary/30 rounded-sm" onSelect={(e) => e.preventDefault()}>
                <Globe className="h-4 w-4 mr-2" /> Feature
                <span className="ml-auto text-xs text-muted-foreground">Submit for review</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <EyeOff className="h-4 w-4 mr-2" /> Unlisted
                <span className="ml-auto text-xs text-muted-foreground">Link only</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Lock className="h-4 w-4 mr-2" /> Private
                <span className="ml-auto text-xs text-muted-foreground">Only you</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={handleGotIt} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function OnboardingChecklist() {
  const { user, enrollment, binders, featureBinderEligible } = useStore();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const [shared, setShared] = useState(
    () => localStorage.getItem(SHARED_KEY) === 'true'
  );
  const [feedbackUrl, setFeedbackUrl] = useState<string | null>(null);
  const [showFeatureBinderDialog, setShowFeatureBinderDialog] = useState(false);
  const [featureBinderClicked, setFeatureBinderClicked] = useState(
    () => localStorage.getItem(FEATURE_BINDER_KEY) === 'true'
  );

  useEffect(() => {
    fetch('/api/site-settings/feedback_url_learners')
      .then((r) => r.json())
      .then((data) => setFeedbackUrl(data.value || null))
      .catch(() => setFeedbackUrl(null));
  }, []);

  // Re-check localStorage flag on dialog close
  useEffect(() => {
    if (!showFeatureBinderDialog) {
      setFeatureBinderClicked(localStorage.getItem(FEATURE_BINDER_KEY) === 'true');
    }
  }, [showFeatureBinderDialog]);

  // Re-show checklist if dismissed but user is now feature-eligible and hasn't clicked the item
  useEffect(() => {
    if (dismissed && featureBinderEligible && !featureBinderClicked) {
      localStorage.removeItem(DISMISSED_KEY);
      setDismissed(false);
    }
  }, [dismissed, featureBinderEligible, featureBinderClicked]);

  if (!user) return null;
  if (dismissed) return null;

  const handleFeatureBinder = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowFeatureBinderDialog(true);
  };

  const items: ChecklistItem[] = [
    {
      label: 'Fill in your profile',
      href: '/profile',
      complete: !!(user.name && (user.bio || user.profileTitle) && user.avatarUrl),
    },
    {
      label: 'Check out 3 interesting binders',
      href: '/catalog',
      complete: (JSON.parse(localStorage.getItem(BROWSED_KEY) || '[]') as string[]).length >= 3,
    },
    {
      label: 'Enroll in a binder',
      href: '/catalog',
      complete: !!(enrollment?.activeBinderId || (enrollment?.completedBinderIds?.length ?? 0) > 0),
    },
    {
      label: 'Build your own binder',
      href: '/curator/binder/new/edit',
      complete: binders.some((b) => b.curatorId === user.username),
    },
    {
      label: 'Share Syllabind with a friend',
      href: '#',
      complete: shared,
      onClick: async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(window.location.origin);
          localStorage.setItem(SHARED_KEY, 'true');
          setShared(true);
          toast({ title: 'Link copied!', description: 'Share it with a friend.' });
        } catch {
          toast({ title: 'Failed to copy', description: 'Please copy the link manually.', variant: 'destructive' });
        }
      },
    },
    ...(featureBinderEligible ? [{
      label: 'Submit a feature binder',
      href: '#',
      complete: featureBinderClicked,
      onClick: handleFeatureBinder,
    }] : []),
  ];

  const completedCount = items.filter((i) => i.complete).length;
  const allDone = completedCount === items.length;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <>
      <Card className="onboarding-checklist">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Getting Started</CardTitle>
          <p className="text-sm text-muted-foreground">{completedCount} of {items.length} complete</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {allDone ? (
            <div className="onboarding-congrats flex flex-col items-center text-center gap-2 py-2">
              <PartyPopper className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">You're all set!</p>
              {feedbackUrl && (
                <a href={feedbackUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <MessageSquareHeart className="h-3.5 w-3.5" />
                    Give Feedback
                  </Button>
                </a>
              )}
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Dismiss
              </Button>
            </div>
          ) : (
            <ul className="onboarding-items space-y-2">
              {items.map((item) => (
                <li key={item.label}>
                  {item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className={cn(
                        'flex items-center gap-2.5 text-sm rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-muted w-full text-left',
                        item.complete && 'text-muted-foreground line-through'
                      )}
                    >
                      {item.complete ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      )}
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 text-sm rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-muted',
                        item.complete && 'text-muted-foreground line-through'
                      )}
                    >
                      {item.complete ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      )}
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!allDone && (
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleDismiss}>
              Dismiss
            </Button>
          )}
        </CardContent>
      </Card>
      {featureBinderEligible && (
        <FeatureBinderInfoDialog open={showFeatureBinderDialog} onOpenChange={setShowFeatureBinderDialog} />
      )}
    </>
  );
}
