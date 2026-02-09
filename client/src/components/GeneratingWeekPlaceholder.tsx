import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Step } from '@/lib/types';

interface GeneratingWeekPlaceholderProps {
  weekIndex: number;
  status: string;
  title?: string;
  description?: string;
  currentSteps?: Step[];  // Steps received so far
}

export function GeneratingWeekPlaceholder({ weekIndex, status, title, description, currentSteps = [] }: GeneratingWeekPlaceholderProps) {
  const remainingCount = Math.max(0, 4 - currentSteps.length);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Generation status header */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-primary">
          {status || `Generating Week ${weekIndex}...`}
        </span>
      </div>

      {/* Week title - show real content or skeleton */}
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Week Title (Optional)</span>
        {title ? (
          <div className="h-10 px-3 py-2 rounded-md border bg-background text-base step-appear">
            {title}
          </div>
        ) : (
          <Skeleton className="h-10 w-full animate-shimmer" />
        )}
      </div>

      {/* Week description - show real content or skeleton */}
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Weekly Summary (Optional)</span>
        {description ? (
          <div className="min-h-[6rem] px-3 py-2 rounded-md border bg-background text-sm step-appear" dangerouslySetInnerHTML={{ __html: description }} />
        ) : (
          <Skeleton className="h-24 w-full animate-shimmer" />
        )}
      </div>

      {/* Steps section */}
      <div className="space-y-4 mt-8">
        {/* Render real steps that have been received */}
        {currentSteps.map((step, idx) => (
          <div
            key={step.id}
            className="border rounded-lg p-5 bg-muted/20 step-appear"
          >
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="text-[10px] sm:text-xs uppercase px-1.5 sm:px-2 py-0.5 tracking-wider font-semibold">
                {step.type}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">Step {idx + 1}</span>
            </div>
            <div className="font-medium text-base mb-2">{step.title}</div>
            {step.type === 'reading' && step.author && (
              <div className="text-sm text-muted-foreground mb-2">by {step.author}</div>
            )}
            {step.type === 'reading' && step.url && (
              <div className="text-xs text-primary/70 truncate">{step.url}</div>
            )}
            {step.type === 'exercise' && step.promptText && (
              <div className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: step.promptText }} />
            )}
          </div>
        ))}

        {/* Render skeleton placeholders for remaining steps */}
        {Array.from({ length: remainingCount }).map((_, idx) => (
          <div
            key={`skeleton-${idx}`}
            className="border rounded-lg p-5 bg-muted/10 animate-shimmer"
            style={{ animationDelay: `${(currentSteps.length + idx) * 0.15}s` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
