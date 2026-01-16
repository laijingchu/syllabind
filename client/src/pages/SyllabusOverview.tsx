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
import { Clock, BarChart, BookOpen, ChevronRight, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function SyllabusOverview() {
  const [match, params] = useRoute('/syllabus/:id');
  const { getSyllabusById, enrollInSyllabus, enrollment } = useStore();
  const [location, setLocation] = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);

  const syllabus = match && params?.id ? getSyllabusById(params.id) : undefined;

  if (!syllabus) return <div className="text-center py-20">Syllabus not found</div>;

  const isActive = enrollment.activeSyllabusId === syllabus.id;
  const isCompleted = enrollment.completedSyllabusIds.includes(syllabus.id);

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
      enrollInSyllabus(syllabus.id);
      setLocation(`/syllabus/${syllabus.id}/week/1`);
    }
  };

  const confirmSwitch = () => {
    enrollInSyllabus(syllabus.id);
    setShowConfirm(false);
    setLocation(`/syllabus/${syllabus.id}/week/1`);
  };

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
              <span>{syllabus.durationWeeks} Weeks</span>
            </div>
             <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{syllabus.weeks.reduce((acc, w) => acc + w.steps.length, 0)} Steps</span>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-serif">What you'll learn</h2>
            <div className="space-y-4">
              {syllabus.weeks.map((week) => (
                <div 
                  key={week.index} 
                  className={cn(
                    "flex gap-4 items-start p-4 rounded-lg bg-secondary/20 border border-transparent transition-colors",
                    (isCompleted) && "hover:border-primary/50 cursor-pointer hover:bg-secondary/30"
                  )}
                  onClick={() => {
                    if (isCompleted) {
                      setLocation(`/syllabus/${syllabus.id}/week/${week.index}`);
                    }
                  }}
                >
                  <div className={cn(
                    "bg-background h-8 w-8 rounded-full flex items-center justify-center font-mono text-sm font-medium shrink-0 border shadow-sm transition-colors",
                    (isCompleted) && "bg-primary text-primary-foreground border-primary"
                  )}>
                    {isCompleted ? <Check className="h-4 w-4" /> : week.index}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={cn("font-medium text-lg mb-1", isCompleted && "text-primary")}>
                        {week.title || `Week ${week.index}`}
                      </h3>
                      {isCompleted && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {week.steps.length} steps &bull; {week.steps.reduce((acc, s) => acc + (s.estimatedMinutes || 0), 0)} mins est.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky top-24">
          <div className="border rounded-xl p-6 bg-card shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Ready to start?</h3>
              <p className="text-sm text-muted-foreground">Commit to {syllabus.durationWeeks} weeks of focused learning.</p>
            </div>
            
            <Button size="lg" className="w-full" onClick={handleStartClick}>
              {isActive ? 'Continue Learning' : isCompleted ? 'Review Syllabus' : 'Start this Syllabind'}
            </Button>
            
            {isActive && (
               <p className="text-xs text-center text-muted-foreground">You are currently enrolled.</p>
            )}
          </div>
        </div>
      </div>

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
