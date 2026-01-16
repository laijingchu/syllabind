import { useRoute, useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Clock, BarChart, BookOpen, ChevronRight, Check, FileText, Dumbbell, User as UserIcon, Link as LinkIcon, Lock, Linkedin, Twitter, Globe, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { cn, pluralize } from '@/lib/utils';
import { LearnerProfile } from '@/lib/types';

export default function SyllabusOverview() {
  const [match, params] = useRoute('/syllabus/:id');
  const { getSyllabusById, enrollInSyllabus, enrollment, isStepCompleted, getExerciseText, getLearnersForSyllabus } = useStore();
  const [location, setLocation] = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const { updateUser } = useStore();

  const syllabus = match && params?.id ? getSyllabusById(params.id) : undefined;
  const { user: currentUser } = useStore();

  if (!syllabus) return <div className="text-center py-20">Syllabus not found</div>;

  const getStepExercise = (stepId: string) => getExerciseText(stepId);

  // In a real app we'd fetch the creator's profile by ID. 
  // For the mockup, if the current user is the creator (user-1), we show their profile.
  const creator = currentUser?.id === syllabus.creatorId ? currentUser : {
    name: "Alex Rivera",
    expertise: "Cognitive Scientist",
    bio: "Focused on human-computer interaction and the psychological impact of digital environments. Author of 'The Analog Path'.",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
  };

  const isActive = enrollment.activeSyllabusId === syllabus.id;
  const isCompleted = enrollment.completedSyllabusIds.includes(syllabus.id);
  const { getProgressForWeek } = useStore();

  const learners = getLearnersForSyllabus(syllabus.id);
  const inProgressLearners = learners.filter(l => l.status === 'in-progress');
  const completedLearners = learners.filter(l => l.status === 'completed');

  const handleStartClick = () => {
    // If it's active and completed, we treat it as review mode, but let's check
    // If user clicked "Start this Syllabind" on a NEW syllabus while OLD one is completed:
    
    if (isActive) {
      // Continue or Review
      setLocation(`/syllabus/${syllabus.id}/week/${enrollment.currentWeekIndex}`);
    } else if (enrollment.activeSyllabusId) {
      // Check if the ACTIVE syllabus is actually 100% complete.
      // If so, we can just switch silently without nagging.
      // We need to import getOverallProgress from store or calculate it.
      // But `getOverallProgress` isn't exposed directly here... let's add it or use helper.
      // Actually we have `enrollment.completedSyllabusIds`.
      
      const isActiveCompleted = enrollment.completedSyllabusIds.includes(enrollment.activeSyllabusId);
      
      if (isActiveCompleted) {
         // Active one is done, so just switch to new one silently
         enrollInSyllabus(syllabus.id);
         setLocation(`/syllabus/${syllabus.id}/week/1`);
      } else {
         // Active one is IN PROGRESS, so prompt switch
         setShowConfirm(true);
      }
    } else {
      // Enroll
      setShowPrivacyDialog(true);
    }
  };

  const confirmSwitch = () => {
    setShowConfirm(false);
    setShowPrivacyDialog(true);
  };

  const handleEnroll = (shareProfile: boolean) => {
    updateUser({ shareProfile });
    enrollInSyllabus(syllabus.id);
    setShowPrivacyDialog(false);
    setLocation(`/syllabus/${syllabus.id}/week/1`);
  };

  const LearnerAvatar = ({ learner }: { learner: LearnerProfile }) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative cursor-pointer">
            <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              <AvatarImage src={learner.user.avatarUrl} alt={learner.user.name} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {learner.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {learner.status === 'completed' && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 border border-background">
                <Check className="h-2 w-2" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="p-4 w-64 space-y-3 bg-white text-popover-foreground border shadow-xl">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={learner.user.avatarUrl} />
              <AvatarFallback>{learner.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{learner.user.name}</p>
              {learner.user.bio && <p className="text-xs text-muted-foreground line-clamp-2">{learner.user.bio}</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-start pt-1">
            {learner.user.linkedin && (
              <a href={`https://linkedin.com/in/${learner.user.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-[#0077b5] transition-colors ml-[-6px]">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {learner.user.twitter && (
              <a href={`https://twitter.com/${learner.user.twitter}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-[#1DA1F2] transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {learner.user.threads && (
              <a href={`https://threads.net/@${learner.user.threads}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-black dark:hover:text-white transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
             {learner.user.website && (
              <a href={learner.user.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-[2fr_1fr] gap-12 items-start">
        <div className="space-y-8">
          <div>
             <Badge variant="outline" className="mb-4">{syllabus.audienceLevel}</Badge>
             <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6 leading-tight">
               {syllabus.title}
             </h1>
             <p className="text-xl text-muted-foreground leading-relaxed">
               {syllabus.description}
             </p>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground border-y py-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{pluralize(syllabus.durationWeeks, 'Week')}</span>
            </div>
             <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{pluralize(syllabus.weeks.reduce((acc, w) => acc + w.steps.length, 0), 'Step')}</span>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-serif">What you'll learn</h2>
            <Accordion type="single" collapsible className="space-y-4">
              {syllabus.weeks.filter(w => w.steps.length > 0).map((week) => {
                const weekDone = isActive && getProgressForWeek(syllabus.id, week.index) === 100;
                
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
                          "bg-background h-8 w-8 rounded-full flex items-center justify-center font-mono text-sm font-medium shrink-0 border shadow-sm transition-colors",
                          weekDone && "bg-primary text-primary-foreground border-primary"
                        )}>
                          {weekDone ? <Check className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground/70" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className={cn("font-medium text-lg mb-1", weekDone && "text-primary")}>
                              {week.title || `Week ${week.index}`}
                            </h3>
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

          {/* Classmates Section moved here */}
          {(inProgressLearners.length > 0 || completedLearners.length > 0) && (
            <div className="pt-8 space-y-6">
               <div className="flex justify-between items-baseline border-b pb-4">
                 <h2 className="text-2xl font-serif">Classmates</h2>
                 <span className="text-sm text-muted-foreground">{learners.length} enrolled</span>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                 {inProgressLearners.length > 0 && (
                   <div className="space-y-3">
                     <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">In Progress</p>
                     <div className="flex -space-x-3 overflow-hidden py-1">
                       {inProgressLearners.map(learner => (
                         <LearnerAvatar key={learner.user.id} learner={learner} />
                       ))}
                     </div>
                   </div>
                 )}

                 {completedLearners.length > 0 && (
                    <div className="space-y-3">
                     <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completed</p>
                     <div className="flex -space-x-3 overflow-hidden py-1">
                       {completedLearners.map(learner => (
                         <LearnerAvatar key={learner.user.id} learner={learner} />
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

        <div className="sticky top-24">
          <div className="border rounded-xl p-6 bg-card shadow-sm space-y-6">
            <div className="space-y-2">
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
            
            {isActive && !isCompleted && (
               <p className="text-xs text-center text-muted-foreground">You are currently enrolled.</p>
            )}

            <div className="pt-6 border-t space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Created by</h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={creator.avatarUrl} />
                  <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
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

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Syllabus?</AlertDialogTitle>
            <AlertDialogDescription>
              You are currently enrolled in another syllabus. Switching will pause your progress there and start this one. You can only have one active syllabus at a time to maintain focus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitch}>Switch Syllabus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
