import { useRoute, useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, BarChart, BookOpen, ChevronRight, Check, FileText, Dumbbell, User as UserIcon, Link as LinkIcon, Lock, Linkedin, Twitter, Globe, MessageCircle, AlertTriangle, Share2, X, CalendarDays, Crown, Hash, Eye, ArrowLeft } from 'lucide-react';
import { ShareDialog } from '@/components/ShareDialog';
import { useState, useEffect } from 'react';
import { cn, pluralize } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { ReaderProfile, Binder } from '@/lib/types';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useToast } from '@/hooks/use-toast';

export default function BinderOverview() {
  const [match, params] = useRoute('/binder/:id');
  const [guestPreviewMatch] = useRoute('/create/preview');
  const { getBinderById, enrollInBinder, enrollment, getExerciseText, getReadersForBinder, updateEnrollmentShareProfile, isPro } = useStore();
  const [location, setLocation] = useLocation();
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeVariant, setUpgradeVariant] = useState<'enrollment-gate' | 'pro-feature'>('enrollment-gate');
  const [slackUrl, setSlackUrl] = useState<string | null>(null);
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [binder, setBinder] = useState<Binder | undefined>(undefined);
  const [curator, setCurator] = useState<any>(undefined);
  const [enrollmentShareProfile, setEnrollmentShareProfile] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState<{ id: number; currentWeekIndex: number; status: string } | null>(null);
  const [localCompletedStepIds, setLocalCompletedStepIds] = useState<number[]>([]);

  const isGuestPreview = !!guestPreviewMatch;
  const binderId = match && params?.id ? parseInt(params.id) : undefined;
  const { user: currentUser, completedStepIds: storeCompletedStepIds, refreshSubscriptionLimits } = useStore();
  const { toast } = useToast();
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

  // Handle ?subscription=success return from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      toast({ title: 'Welcome to Syllabind Pro!', description: 'Your subscription is now active. You can now enroll.' });
      refreshSubscriptionLimits();
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  // Guest preview: load binder from sessionStorage
  useEffect(() => {
    if (isGuestPreview) {
      try {
        const raw = sessionStorage.getItem('guestBinderPreview');
        if (raw) {
          const data = JSON.parse(raw);
          setBinder({
            ...data,
            id: data.id || -1,
            status: 'draft',
            weeks: (data.weeks || []).map((w: any) => ({
              ...w,
              steps: (w.steps || []).map((s: any) => ({ ...s })),
            })),
          });
        }
      } catch {
        setBinder(undefined);
      }
    }
  }, [isGuestPreview]);

  // Fetch full binder with weeks and steps
  useEffect(() => {
    if (isGuestPreview) return; // Skip API fetch in guest preview
    if (binderId) {
      fetch(`/api/binders/${binderId}`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch binder: ${res.status}`);
          return res.json();
        })
        .then(data => setBinder(data))
        .catch(err => {
          console.error('Failed to fetch binder:', err);
          setBinder(undefined);
        });
    }
  }, [binderId, isGuestPreview]);

  // Fetch readers asynchronously
  useEffect(() => {
    if (isGuestPreview) return;
    if (binderId) {
      getReadersForBinder(binderId).then(({ classmates, totalEnrolled }) => {
        setReaders(classmates);
        setTotalEnrolled(totalEnrolled);
      });
    }
  }, [binderId, isGuestPreview]);

  // Fetch current enrollment for this binder (if any)
  useEffect(() => {
    if (isGuestPreview) return;
    if (binderId && currentUser) {
      fetch(`/api/enrollments`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then((data: any[]) => {
          const match = data.find((e: any) => e.binderId === binderId);
          if (match) {
            setEnrollmentShareProfile(match.shareProfile || false);
            setExistingEnrollment({ id: match.id, currentWeekIndex: match.currentWeekIndex || 1, status: match.status });
          } else {
            setExistingEnrollment(null);
          }
        })
        .catch(() => {});
    }
  }, [binderId, currentUser]);

  // Fetch completed steps for this specific enrollment
  useEffect(() => {
    if (existingEnrollment?.id) {
      fetch(`/api/enrollments/${existingEnrollment.id}/completed-steps`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(data => setLocalCompletedStepIds(data))
        .catch(() => setLocalCompletedStepIds([]));
    } else {
      setLocalCompletedStepIds([]);
    }
  }, [existingEnrollment?.id]);

  // Fetch curator profile
  useEffect(() => {
    if (isGuestPreview) return;
    if (binder?.curatorId) {
      fetch(`/api/users/${binder.curatorId}`, {
        credentials: 'include'
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setCurator(data))
        .catch(err => console.error('Failed to fetch curator:', err));
    }
  }, [binder?.curatorId]);

  // Fetch Slack community URL from site settings
  useEffect(() => {
    if (isGuestPreview) return;
    fetch('/api/site-settings/slack_community_url')
      .then(res => res.json())
      .then(data => setSlackUrl(data.value || null))
      .catch(() => {});
  }, [isGuestPreview]);

  if (!binder) return <div className="text-center py-20">Loading...</div>;

  // Private binder: non-curator sees 404 (skip for guest preview)
  const isCuratorViewing = currentUser?.username === binder.curatorId;
  if (!isGuestPreview && binder.visibility === 'private' && !isCuratorViewing) {
    return (
      <AnimatedPage className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <h1 className="text-2xl font-display">Binder not found</h1>
        <p className="text-muted-foreground">This binder doesn't exist or is not available.</p>
      </AnimatedPage>
    );
  }

  // Use locally-fetched completed steps for this enrollment (works for both active and completed)
  const completedStepIds = localCompletedStepIds.length > 0 ? localCompletedStepIds : storeCompletedStepIds;

  const getStepExercise = (stepId: number) => getExerciseText(stepId);

  // Local helper to compute week progress
  const getWeekProgress = (weekIndex: number) => {
    const week = binder.weeks.find(w => w.index === weekIndex);
    if (!week || week.steps.length === 0) return 0;

    const weekStepIds = week.steps.map(step => step.id);
    const completedCount = weekStepIds.filter(id => completedStepIds.includes(id)).length;
    return Math.round((completedCount / weekStepIds.length) * 100);
  };

  // Calculate effective current week (advances when all steps in current week are done)
  const getEffectiveCurrentWeek = () => {
    if (!existingEnrollment || !binder.weeks.length) return 1;

    let effectiveWeek = existingEnrollment.currentWeekIndex || 1;
    const sortedWeeks = [...binder.weeks].sort((a, b) => a.index - b.index);

    for (const week of sortedWeeks) {
      if (week.index < effectiveWeek) continue;
      if (week.steps.length === 0) continue;

      const weekStepIds = week.steps.map(step => step.id);
      const allDone = weekStepIds.every(id => completedStepIds.includes(id));

      if (allDone && week.index < sortedWeeks[sortedWeeks.length - 1].index) {
        // This week is complete, move to next
        effectiveWeek = week.index + 1;
      } else {
        // Found the current incomplete week (or last week)
        break;
      }
    }

    return effectiveWeek;
  };

  const effectiveCurrentWeek = getEffectiveCurrentWeek();

  const isEnrolled = existingEnrollment !== null;
  const isActive = isEnrolled; // User is enrolled in this binder
  const isCompleted = enrollment?.completedBinderIds?.includes(binder.id);

  const inProgressReaders = (readers || []).filter(l => l.status === 'in-progress');
  const completedReaders = (readers || []).filter(l => l.status === 'completed');

  const handleStartClick = () => {
    // Already enrolled in this binder - just navigate to effective current week
    if (existingEnrollment) {
      setLocation(`/binder/${binder.id}/week/${effectiveCurrentWeek}`);
      return;
    }

    // Not authenticated - redirect to login with returnTo
    if (!currentUser) {
      setLocation(`/login?returnTo=${encodeURIComponent(`/binder/${binder.id}`)}`);
      return;
    }

    // Pro gate: must be Pro to enroll
    if (!isPro) {
      setUpgradeVariant('enrollment-gate');
      setShowUpgradePrompt(true);
      return;
    }

    // Authenticated but not enrolled - show privacy dialog to enroll
    setShowPrivacyDialog(true);
  };

  const handleBookCall = () => {
    if (!currentUser) {
      setLocation(`/login?returnTo=${encodeURIComponent(`/binder/${binder.id}`)}`);
      return;
    }
    if (!isPro) {
      setUpgradeVariant('pro-feature');
      setShowUpgradePrompt(true);
      return;
    }
    if (curator?.schedulingUrl) {
      window.open(curator.schedulingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleJoinSlack = () => {
    if (!currentUser) {
      setLocation(`/login?returnTo=${encodeURIComponent(`/binder/${binder.id}`)}`);
      return;
    }
    if (!isPro) {
      setUpgradeVariant('pro-feature');
      setShowUpgradePrompt(true);
      return;
    }
    if (slackUrl) {
      window.open(slackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEnroll = async (shareProfile: boolean) => {
    await enrollInBinder(binder.id, shareProfile);
    setEnrollmentShareProfile(shareProfile);
    setShowPrivacyDialog(false);
    setLocation(`/binder/${binder.id}/week/1`);
  };

  const ReaderAvatar = ({ reader }: { reader: ReaderProfile }) => {
    const avatarSrc = reader.user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${reader.user.name || reader.user.username}`;
    const initial = (reader.user.name || reader.user.username || '?').charAt(0);
    const [open, setOpen] = useState(false);
    return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button type="button" className="group relative cursor-pointer" onClick={() => setOpen(prev => !prev)}>
            <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              <AvatarImage src={avatarSrc} alt={reader.user.name || reader.user.username} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {initial}
              </AvatarFallback>
            </Avatar>
            {reader.status === 'completed' && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 border border-background">
                <Check className="h-2 w-2" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="p-3 w-60 bg-popover text-popover-foreground border shadow-xl">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0 border border-border/50 mt-0.5">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="space-y-0.5">
                <p className="font-medium text-sm leading-tight truncate">{reader.user.name}</p>
                {reader.user.bio && <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{reader.user.bio}</p>}
              </div>
              <div className="flex gap-0.5 -ml-1">
                {reader.user.linkedin && (
                  <a href={`https://linkedin.com/in/${reader.user.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#0077b5] transition-colors">
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                )}
                {reader.user.twitter && (
                  <a href={`https://twitter.com/${reader.user.twitter}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#1DA1F2] transition-colors">
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                )}
                {reader.user.threads && (
                  <a href={`https://threads.net/@${reader.user.threads}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                )}
                 {reader.user.website && (
                  <a href={reader.user.website} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  };

  return (
    <AnimatedPage className="max-w-4xl mx-auto">
      {isGuestPreview && (
        <div className="preview-banner mb-6 bg-primary/5 border border-primary/20 text-foreground px-4 py-3 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm font-medium">
              Demo Preview: This is how your binder would look to readers.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation('/create')} className="shrink-0 gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Editor
          </Button>
        </div>
      )}
      {isPreview && !isGuestPreview && (
        <div className="preview-banner mb-6 bg-muted border border-border text-muted-foreground px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            Draft Preview: You are viewing a private draft. This content is not yet public.
          </p>
        </div>
      )}
      {binder.visibility === 'unlisted' && (
        <div className="unlisted-banner mb-6 bg-muted border border-border text-muted-foreground px-4 py-3 rounded-lg flex items-center gap-3">
          <LinkIcon className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            This binder is unlisted. Only people with the link can access it.
          </p>
        </div>
      )}
      <div className="grid md:grid-cols-[2fr_1fr] gap-12 items-start">
        <div className="space-y-8">
          <div className="binder-header">
             <Badge variant="outline" className="mb-4">{binder.audienceLevel}</Badge>
             <h1 className="text-4xl md:text-5xl font-display text-foreground mb-6 leading-tight">
               {binder.title}
             </h1>
             <div
               className="text-xl text-muted-foreground leading-relaxed prose dark:prose-invert prose-p:my-2 prose-headings:my-3 prose-ul:list-disc prose-ul:pl-5 max-w-none"
               dangerouslySetInnerHTML={{ __html: sanitizeHtml(binder.description) }}
             />
          </div>

          <div className="share-button-section flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share with a Friend
            </Button>
            {slackUrl && (
              <Button variant="outline" onClick={handleJoinSlack} className="gap-2">
                <Hash className="h-4 w-4" />
                Join Slack Community
                {(!currentUser || !isPro) && (
                  <span className="flex items-center gap-0.5 text-muted-foreground">
                    <Crown className="h-3 w-3" />
                    <Lock className="h-3 w-3" />
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* Curator Section */}
          {curator && (
            <div className="curator-section space-y-5">
              <h2 className="text-2xl font-display border-b pb-4">Meet the Curator</h2>
              <div className="space-y-5">
                <div className="curator-info flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-border shrink-0">
                    <AvatarImage src={curator.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${curator.name}`} alt={curator.name} />
                    <AvatarFallback className="text-lg">{curator.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-medium text-lg">{curator.name}</h3>
                    {curator.profileTitle && (
                      <p className="text-sm text-muted-foreground">{curator.profileTitle}</p>
                    )}
                    {curator.expertise && !curator.profileTitle && (
                      <p className="text-sm text-muted-foreground">{curator.expertise}</p>
                    )}
                  </div>
                </div>

                {curator.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{curator.bio}</p>
                )}

                {/* Social links */}
                {(curator.linkedin || curator.twitter || curator.threads || curator.website) && (
                  <div className="flex flex-wrap gap-2">
                    {curator.linkedin && (
                      <a href={`https://linkedin.com/in/${curator.linkedin}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-[#0077b5] transition-colors">
                        <Linkedin className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                    )}
                    {curator.twitter && (
                      <a href={`https://twitter.com/${curator.twitter}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-[#1DA1F2] transition-colors">
                        <Twitter className="h-3.5 w-3.5" />
                        X / Twitter
                      </a>
                    )}
                    {curator.threads && (
                      <a href={`https://threads.net/@${curator.threads}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Threads
                      </a>
                    )}
                    {curator.website && (
                      <a href={curator.website.startsWith('http') ? curator.website : `https://${curator.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-primary transition-colors">
                        <Globe className="h-3.5 w-3.5" />
                        Website
                      </a>
                    )}
                  </div>
                )}

                {/* Pro CTAs */}
                {curator.schedulingUrl && binder?.showSchedulingLink !== false && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button variant="outline" size="sm" onClick={handleBookCall} className="gap-2">
                      <CalendarDays className="h-4 w-4" />
                      1:1 Office Hour
                      {(!currentUser || !isPro) && (
                        <span className="flex items-center gap-0.5 text-muted-foreground">
                          <Crown className="h-3 w-3" />
                          <Lock className="h-3 w-3" />
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="binder-metadata flex flex-wrap gap-6 text-sm text-muted-foreground border-y py-6">
            {binder.category && (
              <div className="metadata-category">
                <Badge variant="outline">{binder.category.name}</Badge>
              </div>
            )}
            <div className="metadata-duration flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{pluralize(binder.durationWeeks, 'Week')}</span>
            </div>
            <div className="metadata-steps flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{pluralize(binder.weeks.reduce((acc, w) => acc + w.steps.length, 0), 'Step')}</span>
            </div>
            {binder.updatedAt && binder.updatedAt !== binder.createdAt ? (
              <div className="metadata-date flex items-center gap-2">
                <span>Updated {new Date(binder.updatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            ) : binder.createdAt ? (
              <div className="metadata-date flex items-center gap-2">
                <span>Created {new Date(binder.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            ) : null}
          </div>

          {/* Tags */}
          {binder.tags && binder.tags.length > 0 && (
            <div className="binder-tags flex flex-wrap gap-1.5">
              {binder.tags.map((tag: any) => (
                <Badge key={tag.id} variant="secondary" className="text-xs font-normal">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="binder-section space-y-6">
            <h2 className="text-2xl font-display">What you'll learn</h2>
            <Accordion type="single" collapsible className="space-y-4" defaultValue={`week-${effectiveCurrentWeek}`}>
              {binder.weeks.filter(w => w.steps.length > 0).map((week) => {
                const weekDone = isActive && getWeekProgress(week.index) === 100;
                const isCurrentWeek = isActive && effectiveCurrentWeek === week.index;
                const isLockedWeek = isActive && week.index > effectiveCurrentWeek;
                const isAccessible = isActive && week.index < effectiveCurrentWeek && !weekDone;

                return (
                  <AccordionItem
                    key={week.index}
                    value={`week-${week.index}`}
                    className="border-none"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 px-4 rounded-lg hover:bg-muted/50 transition-colors [&[data-state=open]>div]:bg-transparent">
                      <div
                        className={cn(
                          "flex gap-4 items-start w-full text-left transition-colors",
                        )}
                      >
                        <div className={cn(
                          "bg-background h-8 w-8 rounded-full flex items-center justify-center font-mono text-sm font-medium shrink-0 border transition-colors",
                          weekDone && "bg-primary text-primary-foreground border-primary",
                          isCurrentWeek && !weekDone && "border-primary text-primary ring-2 ring-primary/20",
                          isAccessible && "border-muted-foreground/40 text-muted-foreground"
                        )}>
                          {weekDone ? <Check className="h-4 w-4" /> : isCurrentWeek ? <ChevronRight className="h-4 w-4" /> : isLockedWeek ? <Lock className="h-3.5 w-3.5 text-muted-foreground/70" /> : week.index}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <h3 className={cn("font-medium text-lg mb-1", weekDone && "text-primary")}>
                                {week.title || `Week ${week.index}`}
                              </h3>
                              {isCurrentWeek && (
                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase tracking-wider">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const visibleSteps = week.steps.filter(s => s.type !== 'reading' || s.url);
                              return `${pluralize(visibleSteps.length, 'step')} \u2022 ${visibleSteps.reduce((acc, w_step) => acc + (w_step.estimatedMinutes || 0), 0)} mins est.`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-16 pr-4 py-2 space-y-3">
                      {week.steps.filter(step => step.type !== 'reading' || step.url).map(step => {
                        const isDone = completedStepIds.includes(step.id);
                        const exerciseLink = step.type === 'exercise' ? getStepExercise(step.id) : null;

                        return (
                          <div key={step.id} className="space-y-2">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className={cn(
                                "p-1.5 rounded-md shrink-0",
                                isDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                              )}>
                                {step.type === 'reading' ? <FileText className="h-3.5 w-3.5" /> : <Dumbbell className="h-3.5 w-3.5" />}
                              </div>
                              <span className={cn(isDone && "text-foreground font-medium")}>
                                {isDone && step.type === 'reading' && step.url ? (
                                  <a
                                    href={step.url.startsWith('http') ? step.url : `https://${step.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline text-primary"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {step.title}
                                  </a>
                                ) : (
                                  step.title
                                )}
                              </span>
                              <span className="text-xs opacity-70 ml-auto tabular-nums">{step.estimatedMinutes}m</span>
                            </div>

                            {isDone && exerciseLink && (
                              <div className="ml-9 pl-3 border-l-2 border-primary/20 pb-1">
                                <a
                                  href={exerciseLink.startsWith('http') ? exerciseLink : `https://${exerciseLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <LinkIcon className="h-3 w-3" />
                                  <span className="truncate max-w-[200px]">{exerciseLink}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Mobile-only Continue Learning button for current week */}
                      {isCurrentWeek && !weekDone && !isCompleted && (
                        <div className="pt-4 md:hidden">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => setLocation(`/binder/${binder.id}/week/${week.index}`)}
                          >
                            Continue Learning
                          </Button>
                        </div>
                      )}

                      {/* Button for past accessible but incomplete weeks */}
                      {isAccessible && !isCompleted && (
                        <div className="pt-4 md:hidden">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => setLocation(`/binder/${binder.id}/week/${week.index}`)}
                          >
                            Go to Week {week.index}
                          </Button>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="pt-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => setLocation(`/binder/${binder.id}/week/${week.index}`)}
                          >
                            Review Week {week.index}
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
            </Accordion>
          </div>

          {/* Classmates Section */}
          {(inProgressReaders.length > 0 || completedReaders.length > 0) && (
            <div id="classmates-section" className="classmates-section pt-8 space-y-6 scroll-mt-24">
               <div className="classmates-header flex justify-between items-baseline border-b pb-4">
                 <h2 className="text-2xl font-display">Classmates</h2>
                 <span className="text-sm text-muted-foreground">{totalEnrolled} enrolled</span>
               </div>

               <div className="classmates-grid grid grid-cols-1 sm:grid-cols-2 gap-8">
                 {inProgressReaders.length > 0 && (
                   <div className="classmates-group space-y-3">
                     <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">In Progress</p>
                     <div className="classmates-avatars flex -space-x-3 overflow-hidden py-1 pl-1">
                       {inProgressReaders.map((reader, index) => (
                         <div key={reader.user.id} style={{ zIndex: inProgressReaders.length - index, position: 'relative' }}>
                            <ReaderAvatar reader={reader} />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {completedReaders.length > 0 && (
                    <div className="classmates-group space-y-3">
                     <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completed</p>
                     <div className="classmates-avatars flex -space-x-3 overflow-hidden py-1 pl-1">
                       {completedReaders.map((reader, index) => (
                         <div key={reader.user.id} style={{ zIndex: completedReaders.length - index, position: 'relative' }}>
                            <ReaderAvatar reader={reader} />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>

               <p className="text-sm text-muted-foreground">
                 Connect with others learning {binder.title}.{slackUrl && (
                   <>
                     {' '}
                     <button onClick={handleJoinSlack} className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                       Join Slack{(!currentUser || !isPro) && <Lock className="h-3 w-3" />}.
                     </button>
                   </>
                 )}
               </p>
            </div>
          )}
        </div>

        <div className="enrollment-sidebar sticky top-24">
          <div className="enrollment-card border rounded-xl p-6 bg-card shadow-sm space-y-6">
            {isGuestPreview ? (
              <>
                <div className="enrollment-cta space-y-2">
                  <h3 className="font-medium text-lg">Like what you see?</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign up to create your own binder with AI-generated readings and exercises.
                  </p>
                </div>
                <Button size="lg" className="w-full" onClick={() => setLocation('/login?mode=signup')}>
                  Sign up to Start
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setLocation('/create')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Editor
                </Button>
              </>
            ) : (
              <>
            <div className="enrollment-cta space-y-2">
              <h3 className="font-medium text-lg">
                {isCompleted ? "Binder Completed" : isActive ? "Continue Learning" : "Ready to start?"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isCompleted
                  ? `You have successfully completed this ${pluralize(binder.durationWeeks, 'week')} course.`
                  : isActive
                    ? "Pick up where you left off."
                    : `Commit to ${pluralize(binder.durationWeeks, 'week')} of focused learning.`
                }
              </p>
            </div>

            <Button size="lg" className="w-full" onClick={handleStartClick}>
              {isActive ? 'Continue Learning' : isCompleted ? 'Review Binder' : 'Start this Binder'}
            </Button>

            {(isActive || isCompleted) && (
               <div className="enrollment-status -mt-3">
                 <div className="enrollment-visibility flex items-center space-x-3 bg-muted/40 p-2.5 rounded-md w-full justify-center">
                    <Switch
                      id="share-profile"
                      className="data-[state=unchecked]:bg-input"
                      checked={enrollmentShareProfile}
                      onCheckedChange={async (checked) => {
                        if (enrollment?.id) {
                          await updateEnrollmentShareProfile(enrollment.id, checked as boolean);
                          setEnrollmentShareProfile(checked as boolean);
                          // Refresh classmates list
                          if (binderId) getReadersForBinder(binderId).then(({ classmates, totalEnrolled }) => {
                            setReaders(classmates);
                            setTotalEnrolled(totalEnrolled);
                          });
                          document.getElementById('classmates-section')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    />
                    <label
                      htmlFor="share-profile"
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground select-none"
                    >
                      Appear in Classmates list
                    </label>
                 </div>
               </div>
            )}
              </>
            )}

          </div>
        </div>
      </div>

      <AlertDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <AlertDialogContent>
          <button
            onClick={() => setShowPrivacyDialog(false)}
            className="absolute right-2 top-2 flex h-12 w-12 items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle>Join and Connect?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to share your profile with other classmates? This allows you to connect with others learning {binder.title}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => handleEnroll(false)}>Join Privately</Button>
            <Button onClick={() => handleEnroll(true)}>Join & Share Profile</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        title="Share this Binder"
      />

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        variant={upgradeVariant}
        returnTo={`/binder/${binder.id}`}
      />
    </AnimatedPage>
  );
}
