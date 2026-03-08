import { Link, useRoute } from 'wouter';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Binder } from '@/lib/types';

export default function Completion() {
  const [match, params] = useRoute('/binder/:id/completed');
  const { enrollment, completeActiveBinder, user: currentUser } = useStore();
  const completedRef = useRef(false);

  const binderId = params?.id ? parseInt(params.id) : undefined;

  const [binder, setBinder] = useState<Binder | undefined>(undefined);
  const [completedStepIds, setCompletedStepIds] = useState<number[]>([]);
  const [localEnrollmentId, setLocalEnrollmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch full binder with weeks and steps
  useEffect(() => {
    if (binderId) {
      setLoading(true);
      fetch(`/api/binders/${binderId}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch binder: ${res.status}`);
          return res.json();
        })
        .then(data => setBinder(data))
        .catch(err => {
          console.error('Failed to fetch binder:', err);
          setBinder(undefined);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [binderId]);

  // Fetch enrollment for this specific binder
  useEffect(() => {
    if (binderId && currentUser) {
      fetch('/api/enrollments', { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then((data: any[]) => {
          const match = data.find((e: any) => e.binderId === binderId);
          if (match) setLocalEnrollmentId(match.id);
        })
        .catch(() => {});
    }
  }, [binderId, currentUser]);

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
  const allStepIds = binder?.weeks?.flatMap(w => w.steps.map(s => s.id)) || [];
  const completedCount = allStepIds.filter(id => completedStepIds.includes(id)).length;
  const progress = allStepIds.length > 0 ? Math.round((completedCount / allStepIds.length) * 100) : 0;
  const isComplete = progress === 100;

  // Mark the enrollment as completed only when all steps are done
  useEffect(() => {
    if (
      !completedRef.current &&
      isComplete &&
      binderId &&
      enrollment?.activeBinderId === binderId
    ) {
      completedRef.current = true;
      completeActiveBinder();
    }
  }, [isComplete, binderId, enrollment?.activeBinderId]);

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

  if (!binder) return <div>Not found</div>;

  // Incomplete state — missing assignments
  if (!isComplete) {
    const remaining = allStepIds.length - completedCount;

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4 space-y-8">
        <div className="h-24 w-24 bg-warning-surface rounded-full flex items-center justify-center">
          <AlertCircle className="h-12 w-12 text-warning" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-display text-foreground">Almost There!</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            You have {remaining} incomplete {remaining === 1 ? 'assignment' : 'assignments'} remaining in <strong>{binder.title}</strong>. Complete all steps to finish the Binder and earn your certificate.
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
          <Link href={`/binder/${binder.id}/week/${binder.durationWeeks}`}>
            <Button variant="secondary" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Last Week
            </Button>
          </Link>
          <Link href={`/binder/${binder.id}`}>
            <Button className="w-full sm:w-auto">
              Return to Binder Overview
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
        <div className="h-32 w-32 bg-primary-surface rounded-full flex items-center justify-center animate-in zoom-in duration-500">
           <Award className="h-16 w-16 text-primary" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-full border shadow-sm">
           <span className="text-2xl">&#x1F393;</span>
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-backwards">
        <h1 className="text-4xl md:text-5xl font-display text-foreground">Congratulations!</h1>
        <p className="text-xl text-muted-foreground">
          You've completed the <strong>{binder.title}</strong> Binder.
        </p>
        <p className="text-muted-foreground max-w-md mx-auto">
          You showed up for {binder.durationWeeks} weeks and did the work. Take a moment to appreciate your focus.
        </p>
      </div>

      <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-backwards">
        <Link href="/">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
        <Link href="/catalog">
          <Button>Find your next path <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </Link>
      </div>
    </div>
  );
}
