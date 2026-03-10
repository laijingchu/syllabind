import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, PartyPopper, MessageSquareHeart } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'syllabind_onboarding_dismissed';
const BROWSED_KEY = 'syllabind_browsed_binders';

interface ChecklistItem {
  label: string;
  href: string;
  complete: boolean;
}

export function OnboardingChecklist() {
  const { user, enrollment, binders } = useStore();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const [feedbackUrl, setFeedbackUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/site-settings/feedback_url_learners')
      .then((r) => r.json())
      .then((data) => setFeedbackUrl(data.value || null))
      .catch(() => setFeedbackUrl(null));
  }, []);

  if (!user) return null;
  if (dismissed && !user.isAdmin) return null;

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
      href: '/curator/binder/new',
      complete: binders.some((b) => b.curatorId === user.username),
    },
  ];

  const completedCount = items.filter((i) => i.complete).length;
  const allDone = completedCount === items.length;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
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
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
