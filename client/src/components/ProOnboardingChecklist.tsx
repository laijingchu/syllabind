import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, PartyPopper, CalendarDays, Hash, Linkedin, Twitter, Globe } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'syllabind_pro_onboarding_dismissed';
const JOINED_COMMUNITY_KEY = 'syllabind_joined_community';
const ENROLLED_ANOTHER_KEY = 'syllabind_pro_enrolled_another';
const OFFICE_HOUR_KEY = 'syllabind_office_hour_clicked';

interface ChecklistItem {
  label: string;
  href: string;
  complete: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function OfficeHourInfoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handleGotIt = () => {
    localStorage.setItem(OFFICE_HOUR_KEY, 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book a 1:1 Office Hour</DialogTitle>
          <DialogDescription>
            Curators can post their calendar scheduling link so you can book a paid 1:1 session. Look for the "1:1 Office Hour" button in the "Meet the Curator" card on any binder page.
          </DialogDescription>
        </DialogHeader>

        {/* Static demo curator card */}
        <div className="border rounded-xl p-6 bg-card shadow-sm space-y-5">
          <h3 className="font-medium text-lg border-b pb-3">Meet the Curator</h3>
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-border shrink-0">
              <AvatarFallback className="text-lg">J</AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <h3 className="font-medium">Jane Smith</h3>
              <p className="text-xs text-muted-foreground">Learning Designer</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted text-muted-foreground cursor-default">
              <Linkedin className="h-[18px] w-[18px]" />
            </span>
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted text-muted-foreground cursor-default">
              <Twitter className="h-[18px] w-[18px]" />
            </span>
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted text-muted-foreground cursor-default">
              <Globe className="h-[18px] w-[18px]" />
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" className="w-full gap-2 ring-2 ring-primary/30 pointer-events-none">
              <CalendarDays className="h-4 w-4" />
              1:1 Office Hour
            </Button>
            <Button variant="secondary" size="sm" className="w-full gap-2 pointer-events-none opacity-50">
              <Hash className="h-4 w-4" />
              Join learning community
            </Button>
          </div>
        </div>

        <Button onClick={handleGotIt} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function ProOnboardingChecklist() {
  const { user, enrollment, binders, isPro } = useStore();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const [showOfficeHourDialog, setShowOfficeHourDialog] = useState(false);
  const [joinedCommunity, setJoinedCommunity] = useState(
    () => localStorage.getItem(JOINED_COMMUNITY_KEY) === 'true'
  );
  const [officeHourClicked, setOfficeHourClicked] = useState(
    () => localStorage.getItem(OFFICE_HOUR_KEY) === 'true'
  );

  // Re-check localStorage flags on dialog close / focus
  useEffect(() => {
    if (!showOfficeHourDialog) {
      setOfficeHourClicked(localStorage.getItem(OFFICE_HOUR_KEY) === 'true');
    }
  }, [showOfficeHourDialog]);

  if (!user || !isPro) return null;
  if (dismissed) return null;

  const handleJoinCommunity = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/site-settings/slack_community_url');
      const data = await res.json();
      if (data.value) {
        window.open(data.value, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // ignore
    }
    localStorage.setItem(JOINED_COMMUNITY_KEY, 'true');
    setJoinedCommunity(true);
  };

  const handleOfficeHour = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowOfficeHourDialog(true);
  };

  const myBindersCount = binders.filter(b => b.curatorId === user.username).length;
  const totalEnrollments = (enrollment?.completedBinderIds?.length ?? 0) + (enrollment?.activeBinderId ? 1 : 0);

  const items: ChecklistItem[] = [
    {
      label: 'Join exclusive community',
      href: '#',
      complete: joinedCommunity,
      onClick: handleJoinCommunity,
    },
    {
      label: 'Build more binders with AI',
      href: '/curator/binder/new',
      complete: myBindersCount >= 2,
    },
    {
      label: 'Enroll in another binder',
      href: '/catalog',
      complete: totalEnrollments >= 2,
    },
    {
      label: 'Book 1:1 with featured curator',
      href: '#',
      complete: officeHourClicked,
      onClick: handleOfficeHour,
    },
  ];

  const completedCount = items.filter(i => i.complete).length;
  const allDone = completedCount === items.length;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <>
      <Card className="pro-onboarding-checklist">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pro Features</CardTitle>
          <p className="text-sm text-muted-foreground">{completedCount} of {items.length} complete</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {allDone ? (
            <div className="onboarding-congrats flex flex-col items-center text-center gap-2 py-2">
              <PartyPopper className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">You've explored all Pro features!</p>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Dismiss
              </Button>
            </div>
          ) : (
            <ul className="onboarding-items space-y-2">
              {items.map(item => (
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
        </CardContent>
      </Card>
      <OfficeHourInfoDialog open={showOfficeHourDialog} onOpenChange={setShowOfficeHourDialog} />
    </>
  );
}
