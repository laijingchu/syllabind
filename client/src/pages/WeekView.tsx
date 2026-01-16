import { useRoute, useLocation, Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ExternalLink, Lock, CheckCircle, ChevronRight, ChevronLeft, Check, Link as LinkIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn, pluralize } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';

export default function WeekView() {
  const [match, params] = useRoute('/syllabus/:id/week/:index');
  const { 
    getSyllabusById, 
    enrollment, 
    markStepComplete, 
    markStepIncomplete, 
    isStepCompleted,
    saveExercise,
    getProgressForWeek
  } = useStore();
  const [location, setLocation] = useLocation();

  const syllabusId = params?.id;
  const weekIndex = parseInt(params?.index || '1');
  const syllabus = syllabusId ? getSyllabusById(syllabusId) : undefined;
  const week = syllabus?.weeks.find(w => w.index === weekIndex);

  // Locking Logic
  // A week is locked if the previous week is not 100% complete.
  // Exception: Week 1 is always unlocked.
  const isLocked = weekIndex > 1 && getProgressForWeek(syllabusId!, weekIndex - 1) < 100;
  // Also locked if we try to jump ahead multiple weeks, but the recursive logic above covers it if we assume linear progression.
  // Actually, standard logic: Week N is locked if Week N-1 is not complete.
  
  if (!syllabus || !week) return <div>Not found</div>;

  const progress = getProgressForWeek(syllabus.id, weekIndex);

  // Exercise State Management (Local buffer before saving)
  const [exerciseText, setExerciseText] = useState<Record<string, string>>({});

  const handleExerciseChange = (stepId: string, val: string) => {
    setExerciseText(prev => ({ ...prev, [stepId]: val }));
  };

  const handleExerciseSubmit = (stepId: string) => {
    if (exerciseText[stepId]?.trim()) {
      saveExercise(stepId, exerciseText[stepId]);
    }
  };

  // Completion Check
  useEffect(() => {
    // If all steps in this week are done, and this is the last week, we might want to prompt completion.
    // Or just let them click "Finish".
  }, [progress]);

  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-serif">{pluralize(weekIndex, 'Week')} is Locked</h2>
        <p className="text-muted-foreground">Complete all steps in {pluralize(weekIndex - 1, 'Week')} to unlock this content.</p>
        <Link href={`/syllabus/${syllabus.id}/week/${weekIndex - 1}`}>
          <Button>Go to {pluralize(weekIndex - 1, 'Week')}</Button>
        </Link>
      </div>
    );
  }

  const isLastWeek = weekIndex === syllabus.durationWeeks;
  const allDone = progress === 100;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <header className="mb-10">
        <Link href="/">
          <a className="text-sm text-muted-foreground hover:text-primary mb-4 flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </a>
        </Link>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-1">{syllabus.title}</h2>
            <h1 className="text-3xl font-serif">{week.title || pluralize(week.index, 'Week')}</h1>
          </div>
          <div className="text-right">
             <div className="text-2xl font-mono font-medium">{progress}%</div>
             <div className="text-xs text-muted-foreground">Week Completed</div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </header>

      <div className="space-y-8">
        {week.steps.length === 0 && (
           <div className="text-center py-10 text-muted-foreground italic">No steps for this week yet.</div>
        )}
        
        {week.steps.map((step, idx) => {
          const isDone = isStepCompleted(step.id);
          
          return (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-6 rounded-xl border bg-card transition-all duration-300",
                isDone ? "border-primary/20 bg-primary/5" : "border-border shadow-sm hover:shadow-md"
              )}
            >
              <div className="flex gap-4 items-start">
                <div className="mt-1">
                   {step.type === 'reading' ? (
                     <Checkbox 
                       checked={isDone} 
                       onCheckedChange={(c) => c ? markStepComplete(step.id) : markStepIncomplete(step.id)}
                       className="h-6 w-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                     />
                   ) : (
                     <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center", isDone ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30")}>
                        {isDone && <Check className="h-3 w-3" />}
                     </div>
                   )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className={cn("text-lg font-medium", isDone && "text-muted-foreground line-through decoration-primary/30")}>
                      {step.title}
                    </h3>
                    {step.estimatedMinutes && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full whitespace-nowrap">
                        {pluralize(step.estimatedMinutes, 'min')}
                      </span>
                    )}
                  </div>
                  
                  {step.note && <p className="text-muted-foreground text-sm">{step.note}</p>}
                  
                  {step.type === 'reading' && step.url && (
                    <a 
                      href={step.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-2"
                      onClick={() => !isDone && markStepComplete(step.id)} // Optional: auto-complete on click
                    >
                      Read Article <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}

                  {step.type === 'exercise' && (
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-medium mb-2">
                        {step.promptText}
                      </div>
                      {!isDone ? (
                        <div className="space-y-3">
                          <Input 
                            placeholder="Paste your link here (e.g., https://...)" 
                            className="bg-background"
                            value={exerciseText[step.id] || ''}
                            onChange={(e) => handleExerciseChange(step.id, e.target.value)}
                          />
                          <Button 
                            onClick={() => handleExerciseSubmit(step.id)}
                            disabled={!exerciseText[step.id]?.trim()}
                          >
                            Save & Mark Complete
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-background border p-4 rounded-lg text-sm text-muted-foreground flex items-center justify-between">
                           <div>
                             <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-primary">Your Link</div>
                             <a 
                               href={exerciseText[step.id]?.startsWith('http') ? exerciseText[step.id] : `https://${exerciseText[step.id]}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-primary hover:underline font-medium break-all"
                             >
                               {exerciseText[step.id]}
                             </a>
                           </div>
                           <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
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

      <div className="flex justify-between items-center mt-12 pt-8 border-t">
         {weekIndex > 1 ? (
           <Link href={`/syllabus/${syllabus.id}/week/${weekIndex - 1}`}>
             <Button variant="ghost"><ChevronLeft className="mr-2 h-4 w-4" /> Previous {pluralize(1, 'Week', 'Week')}</Button>
           </Link>
         ) : (
           <div />
         )}

         {allDone && (
           isLastWeek ? (
             <Link href={`/syllabus/${syllabus.id}/completed`}>
               <Button size="lg" className="animate-pulse">Finish Syllabind <CheckCircle className="ml-2 h-4 w-4" /></Button>
             </Link>
           ) : (
             <Link href={`/syllabus/${syllabus.id}/week/${weekIndex + 1}`}>
               <Button>Next {pluralize(1, 'Week', 'Week')} <ChevronRight className="ml-2 h-4 w-4" /></Button>
             </Link>
           )
         )}
      </div>
    </div>
  );
}
