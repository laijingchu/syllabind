import { useRoute, useLocation, Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ExternalLink, Lock, CheckCircle, ChevronRight, ChevronLeft, Check, Link as LinkIcon, Share2 } from 'lucide-react';
import { ShareDialog } from '@/components/ShareDialog';
import { useState, useEffect } from 'react';
import { cn, pluralize } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Syllabus } from '@/lib/types';

export default function WeekView() {
  const [match, params] = useRoute('/syllabus/:id/week/:index');
  const {
    getSyllabusById,
    enrollment,
    markStepComplete,
    markStepIncomplete,
    saveExercise,
    getSubmission,
    completedStepIds: storeCompletedStepIds,
    user: currentUser
  } = useStore();
  const [location, setLocation] = useLocation();

  // All state hooks at the top
  const [syllabus, setSyllabus] = useState<Syllabus | undefined>(undefined);
  const [exerciseText, setExerciseText] = useState<Record<number, string>>({});
  const [isShared, setIsShared] = useState<Record<number, boolean>>({});
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [localCompletedStepIds, setLocalCompletedStepIds] = useState<number[]>([]);
  const [localEnrollmentId, setLocalEnrollmentId] = useState<number | null>(null);

  const syllabusId = params?.id ? parseInt(params.id) : undefined;
  const weekIndex = parseInt(params?.index || '1');

  // Fetch full syllabus with weeks and steps
  useEffect(() => {
    if (syllabusId) {
      fetch(`/api/syllabinds/${syllabusId}`, {
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

  // Fetch enrollment for this specific syllabus
  useEffect(() => {
    if (syllabusId && currentUser) {
      fetch('/api/enrollments', { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then((data: any[]) => {
          const match = data.find((e: any) => e.syllabusId === syllabusId);
          if (match) setLocalEnrollmentId(match.id);
        })
        .catch(() => {});
    }
  }, [syllabusId, currentUser]);

  // Fetch completed steps for this specific enrollment
  useEffect(() => {
    if (localEnrollmentId) {
      fetch(`/api/enrollments/${localEnrollmentId}/completed-steps`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(data => setLocalCompletedStepIds(data))
        .catch(() => setLocalCompletedStepIds([]));
    }
  }, [localEnrollmentId]);

  // Completion Check
  useEffect(() => {
    // If all steps in this week are done, and this is the last week, we might want to prompt completion.
    // Or just let them click "Finish".
  }, [syllabus, weekIndex]);

  const week = syllabus?.weeks.find(w => w.index === weekIndex);

  // Use locally-fetched completed steps (works for both active and completed enrollments)
  const completedStepIds = localCompletedStepIds.length > 0 ? localCompletedStepIds : storeCompletedStepIds;
  const isStepCompleted = (stepId: number) => completedStepIds.includes(stepId);

  // Wrap step actions to keep local state in sync
  const handleMarkComplete = async (stepId: number) => {
    await markStepComplete(stepId);
    setLocalCompletedStepIds(prev => prev.includes(stepId) ? prev : [...prev, stepId]);
  };

  const handleMarkIncomplete = async (stepId: number) => {
    await markStepIncomplete(stepId);
    setLocalCompletedStepIds(prev => prev.filter(id => id !== stepId));
  };

  // Local helper to compute week progress using local syllabus state
  const getWeekProgress = (weekIdx: number) => {
    const wk = syllabus?.weeks.find(w => w.index === weekIdx);
    if (!wk || wk.steps.length === 0) return 0;

    const weekStepIds = wk.steps.map(step => step.id);
    const completedCount = weekStepIds.filter(id => completedStepIds.includes(id)).length;
    return Math.round((completedCount / weekStepIds.length) * 100);
  };

  // Locking Logic
  // A week is locked if the previous week's readings are not all done.
  // Exception: Week 1 is always unlocked.
  const previousWeekReadingsDone = weekIndex > 1 ? (
    syllabus?.weeks.find(w => w.index === weekIndex - 1)?.steps
      .filter(s => s.type === 'reading' && s.url)
      .every(s => isStepCompleted(s.id))
  ) : true;

  const isLocked = weekIndex > 1 && !previousWeekReadingsDone;

  if (!syllabus || !week) return <div>Not found</div>;

  const progress = getWeekProgress(weekIndex);

  const handleExerciseChange = (stepId: number, val: string) => {
    setExerciseText(prev => ({ ...prev, [stepId]: val }));
  };

  const handleShareChange = (stepId: number, val: boolean) => {
    setIsShared(prev => ({ ...prev, [stepId]: val }));
  };

  const handleExerciseSubmit = async (stepId: number) => {
    if (exerciseText[stepId]?.trim()) {
      await saveExercise(stepId, exerciseText[stepId], isShared[stepId] || false);
    }
  };

  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto py-12 sm:py-20 px-4 text-center space-y-4 sm:space-y-6">
        <div className="bg-muted h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mx-auto">
          <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display">{pluralize(weekIndex, 'Week')} is Locked</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Complete all steps in {pluralize(weekIndex - 1, 'Week')} to unlock this content.</p>
        <Link href={`/syllabus/${syllabus.id}/week/${weekIndex - 1}`}>
          <Button className="w-full sm:w-auto">Go to {pluralize(weekIndex - 1, 'Week')}</Button>
        </Link>
      </div>
    );
  }

  const isLastWeek = weekIndex === syllabus.durationWeeks;
  const allReadingsDone = week.steps
    .filter(s => s.type === 'reading' && s.url)
    .every(s => isStepCompleted(s.id));
  
  const allDone = allReadingsDone;

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4 sm:px-0">
      <header className="mb-6 sm:mb-10">
        <div className="flex justify-between items-center mb-4">
          <Link href={`/syllabus/${syllabus.id}`}>
            <a className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Syllabus Overview</span><span className="sm:hidden">Back</span>
            </a>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setShowShareDialog(true)}>
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider mb-1 truncate">{syllabus.title}</h2>
            <h1 className="text-2xl sm:text-3xl font-display">{week.title || pluralize(week.index, 'Week')}</h1>
            {week.description && (
              <div
                className="text-muted-foreground mt-2 prose dark:prose-invert prose-p:my-1 prose-ul:list-disc prose-ul:pl-5 max-w-none text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: week.description }}
              />
            )}
          </div>
          <div className="flex items-center sm:block sm:text-right gap-2">
             <div className="text-xl sm:text-2xl font-mono font-medium">{progress}%</div>
             <div className="text-xs text-muted-foreground">completed</div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </header>

      <div className="space-y-8">
        {week.steps.length === 0 && (
           <div className="text-center py-10 text-muted-foreground italic">No steps for this week yet.</div>
        )}
        
        {week.steps
          .filter(step => step.type !== 'reading' || step.url)
          .map((step, idx) => {
          const isDone = isStepCompleted(step.id);
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-4 sm:p-6 rounded-xl border bg-card transition-all duration-300",
                isDone ? "border-primary/20 bg-primary/5" : "border-border shadow-sm hover:shadow-md"
              )}
            >
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="mt-0.5 sm:mt-1 shrink-0">
                   {step.type === 'reading' ? (
                     <Checkbox
                       checked={isDone}
                       onCheckedChange={(c) => c ? handleMarkComplete(step.id) : handleMarkIncomplete(step.id)}
                       className="h-5 w-5 sm:h-6 sm:w-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                     />
                   ) : (
                     <div className={cn("h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 flex items-center justify-center", isDone ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30")}>
                        {isDone && <Check className="h-3 w-3" />}
                     </div>
                   )}
                </div>

                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                  <div className="space-y-1">
                    <h3 className={cn("text-base sm:text-lg font-display font-medium leading-tight", isDone && "text-muted-foreground line-through decoration-primary/30")}>
                      {step.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {step.creationDate && (() => {
                        // Handle both YYYY-MM-DD (ISO) and dd/mm/yyyy (legacy) formats
                        let date: Date;
                        const parts = step.creationDate.split('/');
                        if (parts.length === 3 && parts[2].length === 4) {
                          // dd/mm/yyyy legacy format
                          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                        } else {
                          date = new Date(step.creationDate);
                        }
                        return !isNaN(date.getTime()) ? (
                          <span className="text-xs text-muted-foreground">
                            {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        ) : null;
                      })()}
                      {step.estimatedMinutes && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 sm:py-1 rounded-full">
                          {pluralize(step.estimatedMinutes, 'min')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {step.note && (
                    <div 
                      className="text-muted-foreground text-sm prose dark:prose-invert prose-p:my-1 prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 max-w-none"
                      dangerouslySetInnerHTML={{ __html: step.note }}
                    />
                  )}
                  
                  {step.type === 'reading' && step.url && (
                    <a 
                      href={step.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-2"
                      onClick={() => !isDone && handleMarkComplete(step.id)} // Optional: auto-complete on click
                    >
                      Read Article <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}

                  {step.type === 'exercise' && (
                    <div className="mt-4 space-y-3">
                      <div 
                        className="text-sm font-medium mb-2 prose dark:prose-invert prose-p:my-1 prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 max-w-none"
                        dangerouslySetInnerHTML={{ __html: step.promptText || '' }}
                      />
                      {!isDone ? (
                        <div className="space-y-4">
                          <Input 
                            placeholder="Paste your link here (e.g., https://...)" 
                            className="bg-background"
                            value={exerciseText[step.id] || ''}
                            onChange={(e) => handleExerciseChange(step.id, e.target.value)}
                          />
                          <div className="flex items-center space-x-2">
                             <Checkbox 
                                id={`share-${step.id}`} 
                                checked={isShared[step.id] || false}
                                onCheckedChange={(c) => handleShareChange(step.id, c as boolean)}
                             />
                             <Label htmlFor={`share-${step.id}`} className="text-sm text-muted-foreground font-normal cursor-pointer select-none">
                               Share submission with Creator for feedback
                             </Label>
                          </div>
                          <Button 
                            onClick={() => handleExerciseSubmit(step.id)}
                            disabled={!exerciseText[step.id]?.trim()}
                          >
                            Save & Complete
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <div className="bg-background border p-3 sm:p-4 rounded-lg text-sm text-muted-foreground group">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-primary flex items-center gap-2">
                                    Your Link
                                    {getSubmission(step.id)?.isShared && <Badge variant="secondary" className="text-[10px] h-4 px-1">Shared</Badge>}
                                  </div>
                                  <a
                                    href={exerciseText[step.id]?.startsWith('http') ? exerciseText[step.id] : `https://${exerciseText[step.id]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-medium break-all text-sm"
                                  >
                                    {exerciseText[step.id] || getSubmission(step.id)?.answer}
                                  </a>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => handleMarkIncomplete(step.id)}>
                                   <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                   <span className="sr-only">Edit</span>
                                </Button>
                              </div>
                           </div>
                           
                           {getSubmission(step.id)?.grade && (
                             <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-sm">Creator Feedback</h4>
                                  <Badge>{getSubmission(step.id)?.grade}</Badge>
                                </div>
                                {getSubmission(step.id)?.feedback && (
                                   <div 
                                     className="text-sm prose dark:prose-invert max-w-none"
                                     dangerouslySetInnerHTML={{ __html: getSubmission(step.id)?.feedback || '' }}
                                   />
                                )}
                                {getSubmission(step.id)?.rubricUrl && (
                                  <div className="pt-2 border-t border-primary/10 mt-2">
                                    <a href={getSubmission(step.id)?.rubricUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-primary hover:underline">
                                      <ExternalLink className="h-3 w-3" /> View Rubric
                                    </a>
                                  </div>
                                )}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
         {weekIndex > 1 ? (
           <Link href={`/syllabus/${syllabus.id}/week/${weekIndex - 1}`}>
             <Button variant="ghost" className="w-full sm:w-auto justify-center">
               <ChevronLeft className="mr-2 h-4 w-4" /> Previous Week
             </Button>
           </Link>
         ) : (
           <div className="hidden sm:block" />
         )}

         {allDone && (
           isLastWeek ? (
             <Link href={`/syllabus/${syllabus.id}/completed`}>
               <Button size="lg" className="animate-pulse w-full sm:w-auto justify-center">
                 Finish Syllabind <CheckCircle className="ml-2 h-4 w-4" />
               </Button>
             </Link>
           ) : (
             <Link href={`/syllabus/${syllabus.id}/week/${weekIndex + 1}`}>
               <Button className="w-full sm:w-auto justify-center">
                 Next Week <ChevronRight className="ml-2 h-4 w-4" />
               </Button>
             </Link>
           )
         )}
      </div>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        title="Share this Week"
      />
    </div>
  );
}
