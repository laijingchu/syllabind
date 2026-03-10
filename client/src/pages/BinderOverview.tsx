import { useRoute, useLocation, Link } from 'wouter';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, BookOpen, ChevronRight, Check, FileText, Dumbbell, Link as LinkIcon, Lock, AlertTriangle, X, Eye, ArrowLeft } from 'lucide-react';
import { ShareDialog } from '@/components/ShareDialog';
import { CuratorClassmatesCard, ReaderAvatar } from '@/components/CuratorClassmatesCard';
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
  const [upgradeVariant, setUpgradeVariant] = useState<'enrollment-gate' | 'pro-feature' | 'enrollment-signup'>('enrollment-gate');
  const [upgradeDescription, setUpgradeDescription] = useState<string | undefined>(undefined);
  const [slackUrl, setSlackUrl] = useState<string | null>(null);
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [binder, setBinder] = useState<Binder | undefined>(undefined);
  const [curator, setCurator] = useState<any>(undefined);
  const [enrollmentShareProfile, setEnrollmentShareProfile] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState<{ id: number; currentWeekIndex: number; status: string } | null>(null);
  const [localCompletedStepIds, setLocalCompletedStepIds] = useState<number[]>([]);
  const [flipTrigger, setFlipTrigger] = useState(0);

  const isGuestPreview = !!guestPreviewMatch;
  const binderId = match && params?.id ? parseInt(params.id) : undefined;
  const { user: currentUser, completedStepIds: storeCompletedStepIds, refreshSubscriptionLimits, isAuthenticated } = useStore();
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

  // Track that user browsed a binder (for onboarding checklist — requires 3 distinct binders)
  useEffect(() => {
    if (binder && currentUser && binder.curatorId !== currentUser.username) {
      const key = 'syllabind_browsed_binders';
      const visited: number[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (!visited.includes(binder.id)) {
        visited.push(binder.id);
        localStorage.setItem(key, JSON.stringify(visited));
      }
    }
  }, [binder, currentUser]);

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
  const isAdmin = currentUser?.isAdmin === true;
  const canEdit = isCuratorViewing || isAdmin;
  if (!isGuestPreview && binder.visibility === 'private' && !isCuratorViewing && !isAdmin) {
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

  const handleStartClick = () => {
    // Already enrolled in this binder - just navigate to effective current week
    if (existingEnrollment) {
      setLocation(`/binder/${binder.id}/week/${effectiveCurrentWeek}`);
      return;
    }

    // Not authenticated - show enrollment signup modal
    if (!currentUser) {
      setUpgradeVariant('enrollment-signup');
      setUpgradeDescription(undefined);
      setShowUpgradePrompt(true);
      return;
    }

    // Enrollment limit: free users get 1 active enrollment — server enforces,
    // but show upgrade prompt proactively if they already have an active enrollment
    if (!isPro && enrollment?.activeBinderId && enrollment.activeBinderId !== binder.id) {
      setUpgradeVariant('enrollment-gate');
      setUpgradeDescription(undefined);
      setShowUpgradePrompt(true);
      return;
    }

    // Authenticated but not enrolled - flip sidebar to classmates, then show privacy dialog after flip completes
    setFlipTrigger(n => n + 1);
    setTimeout(() => setShowPrivacyDialog(true), 500);
  };

  const handleBookCall = () => {
    if (!currentUser || !isPro) {
      setUpgradeVariant('pro-feature');
      setUpgradeDescription('Book a 1:1 office hour with the curator for personalized guidance, feedback, and deeper discussion on the material.');
      setShowUpgradePrompt(true);
      return;
    }
    if (curator?.schedulingUrl) {
      window.open(curator.schedulingUrl, '_blank', 'noopener,noreferrer');
      localStorage.setItem('syllabind_office_hour_clicked', 'true');
    }
  };

  const handleJoinSlack = () => {
    if (!currentUser || !isPro) {
      setUpgradeVariant('pro-feature');
      setUpgradeDescription('Join an exclusive Slack community of learners taking this binder. Connect, discuss, and grow together.');
      setShowUpgradePrompt(true);
      return;
    }
    if (slackUrl) {
      window.open(slackUrl, '_blank', 'noopener,noreferrer');
      localStorage.setItem('syllabind_joined_community', 'true');
    }
  };

  const handleEnroll = async (shareProfile: boolean) => {
    try {
      const hadPriorEnrollment = !!(enrollment?.activeBinderId || (enrollment?.completedBinderIds?.length ?? 0) > 0);
      await enrollInBinder(binder.id, shareProfile);
      if (hadPriorEnrollment) {
        localStorage.setItem('syllabind_pro_enrolled_another', 'true');
      }
      setEnrollmentShareProfile(shareProfile);
      setShowPrivacyDialog(false);
      setLocation(`/binder/${binder.id}/week/1`);
    } catch {
      // Already enrolled (409) — just navigate to the binder
      setShowPrivacyDialog(false);
      setLocation(`/binder/${binder.id}/week/${effectiveCurrentWeek}`);
    }
  };

  const handleShareProfileChange = async (checked: boolean) => {
    if (enrollment?.id) {
      await updateEnrollmentShareProfile(enrollment.id, checked);
      setEnrollmentShareProfile(checked);
      if (binderId) getReadersForBinder(binderId).then(({ classmates, totalEnrolled: total }) => {
        setReaders(classmates);
        setTotalEnrolled(total);
      });
    }
  };

  return (
    <AnimatedPage>
      <Button variant="ghost" className="page-header-back -ml-3 mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      {isGuestPreview && (
        <div className="preview-banner mb-6 bg-highlight border border-border text-foreground px-4 py-3 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm font-medium">
              Demo Preview: This is how your binder would look to readers.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setLocation('/create')} className="shrink-0 gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Editor
          </Button>
        </div>
      )}
      {isPreview && !isGuestPreview && (
        <div className="preview-banner mb-6 bg-muted border border-border text-muted-foreground px-4 py-3 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              Draft Preview: You are viewing a private draft.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setLocation(`/curator/binder/${binderId}/edit`)} className="shrink-0 gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Editor
          </Button>
        </div>
      )}
      {binder.status === 'pending_review' && isCuratorViewing && (
        <div className="pending-review-banner mb-6 bg-warning-surface border border-warning-border text-warning px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            This binder is pending admin review and is not yet visible to readers.
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
        <div className="space-y-5">
          <div className="binder-header">
             {isCompleted ? (
               <Badge variant="default" className="mb-4">Completed</Badge>
             ) : isActive ? (
               <Badge variant="tertiary" className="mb-4">In Progress</Badge>
             ) : null}
             <h1 className="text-4xl md:text-5xl font-display text-foreground mb-6 leading-tight">
               {binder.title}
             </h1>
             <div
               className="text-xl text-muted-foreground leading-relaxed prose dark:prose-invert prose-p:my-2 prose-headings:my-3 prose-ul:list-disc prose-ul:pl-5 max-w-none"
               dangerouslySetInnerHTML={{ __html: sanitizeHtml(binder.description) }}
             />
          </div>

          {/* Enrollment CTA Section */}
          <div className="enrollment-section space-y-4">
            {isGuestPreview ? (
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => { setUpgradeVariant('enrollment-signup'); setUpgradeDescription(undefined); setShowUpgradePrompt(true); }}>
                  Sign up to Start
                </Button>
                <Button variant="secondary" onClick={() => setLocation('/create')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Editor
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button size="lg" onClick={handleStartClick}>
                  {isActive ? 'Continue Learning' : isCompleted ? 'Review Binder' : 'Start this Binder'}
                </Button>

              </div>
            )}
          </div>

          <div className="binder-metadata flex flex-wrap gap-6 text-sm text-muted-foreground border-y py-6">
            {binder.category && (
              <div className="metadata-category">
                <Badge variant="secondary">{binder.category.name}</Badge>
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
                <Badge key={tag.id} variant="tertiary" className="text-xs font-normal">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="binder-section space-y-6">
            <h2 className="text-2xl font-display">What you'll learn</h2>
            <Accordion type="multiple" className="space-y-4" defaultValue={[`week-${effectiveCurrentWeek}`]}>
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
                    <AccordionTrigger className="py-4 px-4 rounded-lg hover:bg-muted transition-colors [&[data-state=open]>div]:bg-transparent">
                      <div
                        className={cn(
                          "flex gap-4 items-start w-full text-left transition-colors",
                        )}
                      >
                        <div className={cn(
                          "bg-background h-8 w-8 rounded-full flex items-center justify-center font-mono text-sm font-medium shrink-0 border transition-colors",
                          weekDone && "bg-primary-inverted text-foreground-inverted border-primary",
                          isCurrentWeek && !weekDone && "border-primary text-primary ring-2 ring-ring",
                          isAccessible && "border-border text-muted-foreground"
                        )}>
                          {weekDone ? <Check className="h-4 w-4" /> : isCurrentWeek ? <ChevronRight className="h-4 w-4" /> : isLockedWeek ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : week.index}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <h3 className={cn("font-medium text-lg mb-1", weekDone && "text-primary")}>
                                {week.title || `Week ${week.index}`}
                              </h3>
                              {isCurrentWeek && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase tracking-wider">
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
                      {week.description && (
                        <p className="text-sm text-foreground -mt-1 mb-2">{week.description}</p>
                      )}
                      {week.steps.filter(step => step.type !== 'reading' || step.url).map(step => {
                        const isDone = completedStepIds.includes(step.id);
                        const exerciseLink = step.type === 'exercise' ? getStepExercise(step.id) : null;

                        return (
                          <div key={step.id} className="space-y-2">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className={cn(
                                "p-1.5 rounded-md shrink-0",
                                isDone ? "bg-highlight text-primary" : "bg-muted text-muted-foreground"
                              )}>
                                {step.type === 'reading' ? <FileText className="h-3.5 w-3.5" /> : <Dumbbell className="h-3.5 w-3.5" />}
                              </div>
                              <span className={cn(isDone && "text-foreground font-medium")}>
                                {step.type === 'reading' && step.mediaType && (
                                  <span className="text-foreground">{step.mediaType} | </span>
                                )}
                                {step.type === 'exercise' && (
                                  <span className="text-foreground">Project | </span>
                                )}
                                <span className={cn(!isAuthenticated || !isPro ? "blur-[3px] select-none inline-block" : "")}>
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
                              </span>
                              {step.estimatedMinutes ? <span className="text-xs opacity-70 ml-auto tabular-nums">{step.estimatedMinutes}m</span> : null}
                            </div>

                            {isDone && exerciseLink && (
                              <div className="ml-9 pl-3 border-l-2 border-border pb-1">
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
                            variant="tertiary"
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
                            variant="tertiary"
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

        </div>

        <div className="sticky top-24">
          <CuratorClassmatesCard
            curator={curator}
            binder={binder}
            readers={readers}
            totalEnrolled={totalEnrolled}
            isActive={isActive}
            isCompleted={!!isCompleted}
            enrollmentShareProfile={enrollmentShareProfile}
            onShareProfileChange={handleShareProfileChange}
            onBookCall={handleBookCall}
            onJoinSlack={handleJoinSlack}
            onShareClick={() => setShowShareDialog(true)}
            slackUrl={slackUrl}
            currentUser={currentUser}
            isPro={isPro}
            canEdit={canEdit}
            isGuestPreview={isGuestPreview}
            flipTrigger={flipTrigger}
          />
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
            <AlertDialogTitle>Learn Together, Not Alone</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Skip the small talk with new connections! Show that you are reading this binder in the Classmate's List and let others reach out to you via Linkedin or your other socials.</p>
                <p>No other personal information will be shared without your permission. You can hide your visibility anytime in the Classmates List section.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {readers.slice(0, 5).length > 0 && (
            <div className="flex -space-x-3 overflow-hidden py-1 pl-1">
              {readers.slice(0, 5).map((reader, index) => (
                <div key={reader.user.id} style={{ zIndex: 5 - index, position: 'relative' }}>
                  <ReaderAvatar reader={reader} />
                </div>
              ))}
            </div>
          )}
          <AlertDialogFooter>
            <Button variant="secondary" onClick={() => handleEnroll(false)}>Learn alone</Button>
            <Button onClick={() => handleEnroll(true)}>Add me to Classmates List</Button>
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
        customDescription={upgradeDescription}
        isAuthenticated={isAuthenticated}
        returnTo={`/binder/${binder.id}`}
      />
    </AnimatedPage>
  );
}
