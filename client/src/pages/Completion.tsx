import { Link, useRoute } from 'wouter';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Syllabus } from '@/lib/types';

export default function Completion() {
  const [match, params] = useRoute('/syllabind/:id/completed');
  const { enrollment, completeActiveSyllabus, user: currentUser } = useStore();
  const completedRef = useRef(false);

  const syllabusId = params?.id ? parseInt(params.id) : undefined;

  const [syllabus, setSyllabus] = useState<Syllabus | undefined>(undefined);
  const [completedStepIds, setCompletedStepIds] = useState<number[]>([]);
  const [localEnrollmentId, setLocalEnrollmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch full syllabus with weeks and steps
  useEffect(() => {
    if (syllabusId) {
      setLoading(true);
      fetch(`/api/syllabinds/${syllabusId}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch syllabus: ${res.status}`);
          return res.json();
        })
        .then(data => setSyllabus(data))
        .catch(err => {
          console.error('Failed to fetch syllabus:', err);
          setSyllabus(undefined);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
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

  // Fetch completed steps for this enrollment
  useEffect(() => {
    if (localEnrollmentId) {
      fetch(`/api/enrollments/${localEnrollmentId}/completed-steps`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(data => setCompletedStepIds(data))
        .catch(() => setCompletedStepIds([]));
    }
  }, [localEnrollmentId]);

  // Compute overall progress
  const allStepIds = syllabus?.weeks?.flatMap(w => w.steps.map(s => s.id)) || [];
  const completedCount = allStepIds.filter(id => completedStepIds.includes(id)).length;
  const progress = allStepIds.length > 0 ? Math.round((completedCount / allStepIds.length) * 100) : 0;
  const isComplete = progress === 100;

  // Mark the enrollment as completed only when all steps are done
  useEffect(() => {
    if (
      !completedRef.current &&
      isComplete &&
      syllabusId &&
      enrollment?.activeSyllabusId === syllabusId
    ) {
      completedRef.current = true;
      completeActiveSyllabus();
    }
  }, [isComplete, syllabusId, enrollment?.activeSyllabusId]);

  useEffect(() => {
    if (!isComplete) return;

    // Fire confetti only when truly complete
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [isComplete]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!syllabus) return <div>Not found</div>;

  // Incomplete state — missing assignments
  if (!isComplete) {
    const remaining = allStepIds.length - completedCount;

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4 space-y-8">
        <div className="h-24 w-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-display text-foreground">Almost There!</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            You have {remaining} incomplete {remaining === 1 ? 'assignment' : 'assignments'} remaining in <strong>{syllabus.title}</strong>. Complete all steps to finish the Syllabind and earn your certificate.
          </p>
        </div>

        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedCount} of {allStepIds.length} steps completed</span>
            <span className="font-mono font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href={`/syllabind/${syllabus.id}/week/${syllabus.durationWeeks}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Last Week
            </Button>
          </Link>
          <Link href={`/syllabind/${syllabus.id}`}>
            <Button className="w-full sm:w-auto">
              Return to Syllabind Overview
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Complete celebration state
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
      <div className="relative">
        <div className="h-32 w-32 bg-primary/10 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
           <Award className="h-16 w-16 text-primary" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-full border shadow-sm">
           <span className="text-2xl">🎓</span>
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-backwards">
        <h1 className="text-4xl md:text-5xl font-display text-foreground">Congratulations!</h1>
        <p className="text-xl text-muted-foreground">
          You've completed the <strong>{syllabus.title}</strong> Syllabind.
        </p>
        <p className="text-muted-foreground max-w-md mx-auto">
          You showed up for {syllabus.durationWeeks} weeks and did the work. Take a moment to appreciate your focus.
        </p>
      </div>

      <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-backwards">
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
        <Link href="/catalog">
          <Button>Find your next path <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </Link>
      </div>
    </div>
  );
}
