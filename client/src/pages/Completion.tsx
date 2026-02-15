import { Link, useRoute } from 'wouter';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Award, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Completion() {
  const [match, params] = useRoute('/syllabus/:id/completed');
  const { getSyllabusById, enrollment } = useStore();
  
  // In a real app we'd mark it as completed in store here if not already.
  // For MVP we assume the button in WeekView took us here.
  
  const syllabus = params?.id ? getSyllabusById(parseInt(params.id)) : undefined;

  useEffect(() => {
    // Fire confetti on mount
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
  }, []);

  if (!syllabus) return null;

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
