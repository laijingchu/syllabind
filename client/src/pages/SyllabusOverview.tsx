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
import { Clock, BarChart, BookOpen, ChevronRight, Check, FileText, Dumbbell, User as UserIcon, Link as LinkIcon, Lock, Linkedin, Twitter, Globe, MessageCircle, AlertTriangle, Share2 } from 'lucide-react';
import { ShareDialog } from '@/components/ShareDialog';
import { useState, useEffect } from 'react';
import { cn, pluralize } from '@/lib/utils';
import { LearnerProfile, Syllabus } from '@/lib/types';

export default function SyllabusOverview() {
  const [match, params] = useRoute('/syllabus/:id');
  const { getSyllabusById, enrollInSyllabus, enrollment, isStepCompleted, getExerciseText, getLearnersForSyllabus, updateEnrollmentShareProfile } = useStore();
  const [location, setLocation] = useLocation();
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [syllabus, setSyllabus] = useState<Syllabus | undefined>(undefined);
  const [creator, setCreator] = useState<any>(undefined);
  const [enrollmentShareProfile, setEnrollmentShareProfile] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState<{ id: number; currentWeekIndex: number } | null>(null);

  const syllabusId = match && params?.id ? parseInt(params.id) : undefined;
  const { user: currentUser, completedStepIds } = useStore();
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

  // Fetch full syllabus with weeks and steps
  useEffect(() => {
    if (syllabusId) {
      fetch(`/api/syllabi/${syllabusId}`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch syllabus: ${res.status}`);
          return res.json();
        })
        .then(data => setSyllabus(data))
        .catch(err => {
          console.error('Failed to fetch syllabus:', err);
          setSyllabus(undefined);
        });
    }
  }, [syllabusId]);

  // Fetch learners asynchronously
  useEffect(() => {
    if (syllabusId) {
      getLearnersForSyllabus(syllabusId).then(({ classmates, totalEnrolled }) => {
        setLearners(classmates);
        setTotalEnrolled(totalEnrolled);
      });
    }
  }, [syllabusId]);

  // Fetch current enrollment for this syllabus (if any)
  useEffect(() => {
    if (syllabusId && currentUser) {
      fetch(`/api/enrollments`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then((data: any[]) => {
          const match = data.find((e: any) => e.syllabusId === syllabusId);
          if (match) {
            setEnrollmentShareProfile(match.shareProfile || false);
            setExistingEnrollment({ id: match.id, currentWeekIndex: match.currentWeekIndex || 1 });
          } else {
            setExistingEnrollment(null);
          }
        })
        .catch(() => {});
    }
  }, [syllabusId, currentUser]);

  // Fetch creator profile
  useEffect(() => {
    if (syllabus?.creatorId) {
      fetch(`/api/users/${syllabus.creatorId}`, {
        credentials: 'include'
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setCreator(data))
        .catch(err => console.error('Failed to fetch creator:', err));
    }
  }, [syllabus?.creatorId]);

  if (!syllabus) return <div className="text-center py-20">Loading...</div>;

  const getStepExercise = (stepId: number) => getExerciseText(stepId);

  // Local helper to compute week progress
  const getWeekProgress = (weekIndex: number) => {
    const week = syllabus.weeks.find(w => w.index === weekIndex);
    if (!week || week.steps.length === 0) return 0;

    const weekStepIds = week.steps.map(step => step.id);
    const completedCount = weekStepIds.filter(id => completedStepIds.includes(id)).length;
    return Math.round((completedCount / weekStepIds.length) * 100);
  };

  // Calculate effective current week (advances when all steps in current week are done)
  const getEffectiveCurrentWeek = () => {
    if (!existingEnrollment || !syllabus.weeks.length) return 1;

    let effectiveWeek = existingEnrollment.currentWeekIndex || 1;
    const sortedWeeks = [...syllabus.weeks].sort((a, b) => a.index - b.index);

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
  const isActive = isEnrolled; // User is enrolled in this syllabus
  const isCompleted = enrollment?.completedSyllabusIds?.includes(syllabus.id);

  const inProgressLearners = (learners || []).filter(l => l.status === 'in-progress');
  const completedLearners = (learners || []).filter(l => l.status === 'completed');

  const handleStartClick = () => {
    // Already enrolled in this syllabus - just navigate to effective current week
    if (existingEnrollment) {
      setLocation(`/syllabus/${syllabus.id}/week/${effectiveCurrentWeek}`);
      return;
    }

    // Not authenticated - redirect to login with returnTo
    if (!currentUser) {
      setLocation(`/login?returnTo=${encodeURIComponent(`/syllabus/${syllabus.id}`)}`);
      return;
    }

    // Authenticated but not enrolled - show privacy dialog to enroll
    setShowPrivacyDialog(true);
  };

  const handleEnroll = async (shareProfile: boolean) => {
    await enrollInSyllabus(syllabus.id, shareProfile);
    setEnrollmentShareProfile(shareProfile);
    setShowPrivacyDialog(false);
    setLocation(`/syllabus/${syllabus.id}/week/1`);
  };

  const LearnerAvatar = ({ learner }: { learner: LearnerProfile }) => {
    const avatarSrc = learner.user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${learner.user.name || learner.user.username}`;
    const initial = (learner.user.name || learner.user.username || '?').charAt(0);
    return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative cursor-pointer">
            <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              <AvatarImage src={avatarSrc} alt={learner.user.name || learner.user.username} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {initial}
              </AvatarFallback>
            </Avatar>
            {learner.status === 'completed' && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 border border-background">
                <Check className="h-2 w-2" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="p-3 w-60 bg-popover text-popover-foreground border shadow-xl">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0 border border-border/50 mt-0.5">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="space-y-0.5">
                <p className="font-medium text-sm leading-tight truncate">{learner.user.name}</p>
                {learner.user.bio && <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{learner.user.bio}</p>}
              </div>
              <div className="flex gap-0.5 -ml-1">
                {learner.user.linkedin && (
                  <a href={`https://linkedin.com/in/${learner.user.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#0077b5] transition-colors">
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                )}
                {learner.user.twitter && (
                  <a href={`https://twitter.com/${learner.user.twitter}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#1DA1F2] transition-colors">
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                )}
                {learner.user.threads && (
                  <a href={`https://threads.net/@${learner.user.threads}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                )}
                 {learner.user.website && (
                  <a href={learner.user.website} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
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
      {isPreview && (
        <div className="preview-banner">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            Draft Preview: You are viewing a private draft. This content is not yet public.
          </p>
        </div>
      )}
      <div className="grid md:grid-cols-[2fr_1fr] gap-12 items-start">
        <div className="space-y-8">
          <div className="syllabus-header">
             <Badge variant="outline" className="mb-4">{syllabus.audienceLevel}</Badge>
             <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6 leading-tight">
               {syllabus.title}
             </h1>
             <div
               className="text-xl text-muted-foreground leading-relaxed prose dark:prose-invert prose-p:my-2 prose-headings:my-3 prose-ul:list-disc prose-ul:pl-5 max-w-none"
               dangerouslySetInnerHTML={{ __html: syllabus.description }}
             />
          </div>

          <div className="syllabus-metadata">
            <div className="metadata-duration">
              <Clock className="h-4 w-4" />
              <span>{pluralize(syllabus.durationWeeks, 'Week')}</span>
            </div>
            <div className="metadata-steps">
              <BookOpen className="h-4 w-4" />
              <span>{pluralize(syllabus.weeks.reduce((acc, w) => acc + w.steps.length, 0), 'Step')}</span>
            </div>
            {syllabus.updatedAt && syllabus.updatedAt !== syllabus.createdAt ? (
              <div className="metadata-date">
                <span>Updated {new Date(syllabus.updatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            ) : syllabus.createdAt ? (
              <div className="metadata-date">
                <span>Created {new Date(syllabus.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            ) : null}
          </div>

          <div className="curriculum-section">
            <h2 className="text-2xl font-serif">What you'll learn</h2>
            <Accordion type="single" collapsible className="space-y-4">
              {syllabus.weeks.filter(w => w.steps.length > 0).map((week) => {
                const weekDone = isActive && getWeekProgress(week.index) === 100;
                const isCurrentWeek = isActive && effectiveCurrentWeek === week.index;
                
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
                          isCurrentWeek && !weekDone && "border-primary text-primary ring-2 ring-primary/20"
                        )}>
                          {weekDone ? <Check className="h-4 w-4" /> : isCurrentWeek ? <ChevronRight className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground/70" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <h3 className={cn("font-medium text-lg mb-1", weekDone && "text-primary")}>
                                {week.title || `Week ${week.index}`}
                              </h3>
                              {isCurrentWeek && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {pluralize(week.steps.length, 'step')} &bull; {week.steps.reduce((acc, w_step) => acc + (w_step.estimatedMinutes || 0), 0)} mins est.
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-16 pr-4 py-2 space-y-3">
                      {week.steps.map(step => {
                        const isDone = isStepCompleted(step.id);
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
                            onClick={() => setLocation(`/syllabus/${syllabus.id}/week/${week.index}`)}
                          >
                            Continue Learning
                          </Button>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="pt-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => setLocation(`/syllabus/${syllabus.id}/week/${week.index}`)}
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
          {(inProgressLearners.length > 0 || completedLearners.length > 0) && (
            <div id="classmates-section" className="classmates-section">
               <div className="classmates-header">
                 <h2 className="text-2xl font-serif">Classmates</h2>
                 <span className="text-sm text-muted-foreground">{totalEnrolled} enrolled</span>
               </div>

               <div className="classmates-grid sm:grid-cols-2">
                 {inProgressLearners.length > 0 && (
                   <div className="classmates-group">
                     <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">In Progress</p>
                     <div className="classmates-avatars">
                       {inProgressLearners.map((learner, index) => (
                         <div key={learner.user.id} style={{ zIndex: inProgressLearners.length - index, position: 'relative' }}>
                            <LearnerAvatar learner={learner} />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {completedLearners.length > 0 && (
                    <div className="classmates-group">
                     <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completed</p>
                     <div className="classmates-avatars">
                       {completedLearners.map((learner, index) => (
                         <div key={learner.user.id} style={{ zIndex: completedLearners.length - index, position: 'relative' }}>
                            <LearnerAvatar learner={learner} />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>

               <p className="text-sm text-muted-foreground">
                 Connect with others learning {syllabus.title}.
               </p>
            </div>
          )}
        </div>

        <div className="enrollment-sidebar">
          <div className="enrollment-card">
            <div className="enrollment-cta">
              <h3 className="font-medium text-lg">
                {isCompleted ? "Syllabind Completed" : isActive ? "Continue Learning" : "Ready to start?"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isCompleted
                  ? `You have successfully completed this ${pluralize(syllabus.durationWeeks, 'week')} course.`
                  : isActive
                    ? "Pick up where you left off."
                    : `Commit to ${pluralize(syllabus.durationWeeks, 'week')} of focused learning.`
                }
              </p>
            </div>

            <Button size="lg" className="w-full" onClick={handleStartClick}>
              {isActive ? 'Continue Learning' : isCompleted ? 'Review Syllabus' : 'Start this Syllabind'}
            </Button>

            <Button variant="outline" className="w-full" onClick={() => setShowShareDialog(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share with a Friend
            </Button>

            {(isActive || isCompleted) && (
               <div className="enrollment-status">
                 {isActive && !isCompleted && (
                   <p className="text-xs text-center text-muted-foreground">You are currently enrolled.</p>
                 )}
                 <div className="enrollment-visibility">
                    <Switch
                      id="share-profile"
                      className="data-[state=unchecked]:bg-input"
                      checked={enrollmentShareProfile}
                      onCheckedChange={async (checked) => {
                        if (enrollment?.id) {
                          await updateEnrollmentShareProfile(enrollment.id, checked as boolean);
                          setEnrollmentShareProfile(checked as boolean);
                          // Refresh classmates list
                          if (syllabusId) getLearnersForSyllabus(syllabusId).then(({ classmates, totalEnrolled }) => {
                            setLearners(classmates);
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

            {creator && (
              <div className="creator-card">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Created by</h4>
                <div className="creator-info">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={creator.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${creator.name}`} alt={creator.name} />
                    <AvatarFallback>{creator.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{creator.name}</div>
                    <div className="text-xs text-muted-foreground">{creator.expertise}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  "{creator.bio}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join and Connect?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to share your profile with other classmates? This allows you to connect with others learning {syllabus.title}.
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
        title="Share this Syllabind"
      />
    </AnimatedPage>
  );
}
