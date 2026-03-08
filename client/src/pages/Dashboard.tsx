import { useStore } from '@/lib/store';
import { Link } from 'wouter';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, CheckCircle2, Award, Wand2, BookOpen } from 'lucide-react';
import { BinderCard } from '@/components/BinderCard';
import { pluralize } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Binder } from '@/lib/types';
import { sanitizeHtml } from '@/lib/sanitize';
import { AnimatedCard, AnimatedPage } from '@/components/ui/animated-container';

export default function Dashboard() {
  const { enrollment, getActiveBinder, binders, getBinderById, completedStepIds, enrollmentLoading, bindersLoading, completeActiveBinder } = useStore();
  const activeBinderMetadata = getActiveBinder();
  const [activeBinder, setActiveBinder] = useState<Binder | undefined>(undefined);

  // Fetch full binder data with weeks and steps
  useEffect(() => {
    if (activeBinderMetadata?.id) {
      fetch(`/api/binders/${activeBinderMetadata.id}`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch binder: ${res.status}`);
          return res.json();
        })
        .then(data => setActiveBinder(data))
        .catch(err => {
          console.error('Failed to fetch full binder:', err);
          setActiveBinder(undefined);
        });
    } else {
      setActiveBinder(undefined);
    }
  }, [activeBinderMetadata?.id]);

  // Local helper to compute overall progress
  const getOverallProgress = (binderId: number) => {
    const binder = binderId === activeBinder?.id ? activeBinder : getBinderById(binderId);
    if (!binder || !binder.weeks) return 0;

    const allStepIds = binder.weeks.flatMap(week => week.steps.map(step => step.id));
    if (allStepIds.length === 0) return 0;

    const completedCount = allStepIds.filter(id => completedStepIds.includes(id)).length;
    return Math.round((completedCount / allStepIds.length) * 100);
  };

  // Filter completed binders
  const completedBinders = (enrollment?.completedBinderIds || [])
    .map(id => getBinderById(id))
    .filter((s): s is typeof s & {} => !!s); // Type guard

  const isCompleted = activeBinder && getOverallProgress(activeBinder.id) === 100;

  const allCompleted = binders.length > 0 && binders.every(s => enrollment?.completedBinderIds?.includes(s.id));

  // Wait for enrollment data before deciding what to show
  if (enrollmentLoading || bindersLoading) {
    return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  }

  // If no active binder and no completed binders, show first-time welcome
  if (!activeBinderMetadata && !allCompleted && completedBinders.length === 0) {
    return (
      <AnimatedPage className="py-12 space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-display text-foreground">Welcome to Syllabind</h1>
          <p className="text-lg text-muted-foreground">How would you like to get started?</p>
        </header>

        <div className="grid-12">
          <AnimatedCard delay={0.1} className="col-span-12 sm:col-span-6">
            <Link href="/curator/binder/new">
              <Card className="welcome-card group cursor-pointer outline-2 hover:outline-border hover:shadow-lg transition-all duration-300 h-full">
                <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="bg-primary-surface p-5 rounded-full group-hover:bg-primary-surface transition-colors">
                      <Wand2 className="h-10 w-10 text-primary" />
                    </div>
                    <span className="absolute -top-1 -right-1 inline-block bg-primary-inverted text-foreground-inverted text-xs font-semibold px-2 py-0.5 rounded-md shadow-sm">
                      AI
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-display font-medium">Build your own course</h3>
                    <p className="text-sm text-muted-foreground">Learn anything! Create a multi-week binder with AI assistance.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedCard>

          <AnimatedCard delay={0.2} className="col-span-12 sm:col-span-6">
            <Link href="/catalog">
              <Card className="welcome-card group cursor-pointer outline-2 hover:outline-border hover:shadow-lg transition-all duration-300 h-full">
                <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                  <div className="bg-primary-surface p-5 rounded-full group-hover:bg-primary-surface transition-colors">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-display font-medium">Choose from existing courses</h3>
                    <p className="text-sm text-muted-foreground">Browse curated binders from our community of curators</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedCard>
        </div>
      </AnimatedPage>
    );
  }

  // Wait for full binder data to load
  if (activeBinderMetadata && !activeBinder) {
    return <div className="max-w-4xl mx-auto py-20 text-center">Loading...</div>;
  }

  const suggestedBinders = binders
    .filter(s =>
      (!activeBinder || s.id !== activeBinder.id) &&
      !enrollment?.completedBinderIds?.includes(s.id)
    )
    .slice(0, 3);

  return (
    <AnimatedPage className="space-y-12">
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-display text-foreground mb-2">
            {allCompleted ? "Current Focus" : isCompleted ? "What's Next" : "Current Focus"}
          </h1>
          <p className="text-muted-foreground">
            {allCompleted
              ? "You have mastered all available topics."
              : isCompleted
                ? "Select a new topic to start learning."
                : "Pick up where you left off."
            }
          </p>
        </header>

        {allCompleted ? (
           <AnimatedCard delay={0.1}>
            <Card className="outline-dashed outline-2 bg-muted">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="bg-primary-surface p-4 rounded-full">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-medium">All Binders Completed</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">You've mastered every topic in our catalog. Amazing work! You will receive an email notification when new binders become available.</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        ) : activeBinder ? (
          <>
          <AnimatedCard delay={0.1}>
            <div className="relative rounded-xl outline outline-1 -outline-offset-1 outline-border bg-card text-card-foreground shadow-sm">
            {getOverallProgress(activeBinder.id) === 100 && (
              <div className="absolute -top-6 -right-6 h-28 w-28 text-foreground rounded-full flex items-center justify-center shadow-xl border-4 border-background transform rotate-12 z-20 animate-in zoom-in duration-500 bg-[#ffffff]">
                <div className="text-center -ml-1 mt-2">
                  <Award className="h-8 w-8 mx-auto mb-1" />
                  <div className="text-[10px] font-bold uppercase tracking-widest">Done</div>
                </div>
              </div>
            )}

            <div className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-primary uppercase tracking-wider">
                    {getOverallProgress(activeBinder.id) === 100 ? 'Completed' : 'In Progress'}
                  </div>
                  <h2 className="text-3xl font-display">{activeBinder.title}</h2>
                  <div
                    className="text-muted-foreground max-w-xl prose dark:prose-invert prose-p:my-0"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeBinder.description) }}
                  />
                </div>

                {getOverallProgress(activeBinder.id) < 100 && (
                   <div className="flex flex-col items-end gap-2 min-w-[140px]">
                      <span className="text-2xl font-mono font-medium">{getOverallProgress(activeBinder.id)}%</span>
                      <span className="text-xs text-muted-foreground">Total Completion</span>
                   </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  {getOverallProgress(activeBinder.id) < 100 && (
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{pluralize(enrollment?.currentWeekIndex || 1, 'Week')} of {activeBinder.durationWeeks}</span>
                    </div>
                  )}
                  <Progress value={getOverallProgress(activeBinder.id)} className="h-2" />
                </div>

                {getOverallProgress(activeBinder.id) === 100 ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-primary-surface outline outline-1 -outline-offset-1 outline-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary-inverted text-foreground-inverted h-10 w-10 rounded-full flex items-center justify-center shrink-0">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-primary">Binder Completed!</h3>
                          <p className="text-xs text-muted-foreground">You've earned the completion badge.</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto">
                        <Button size="sm" onClick={completeActiveBinder} className="w-full sm:w-auto">
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Mark Complete
                        </Button>
                        <Link href={`/binder/${activeBinder.id}`} className="w-full sm:w-auto">
                          <Button variant="secondary" size="sm" className="w-full sm:w-auto">View Binder</Button>
                        </Link>
                        <Link href={`/binder/${activeBinder.id}/completed`} className="w-full sm:w-auto">
                          <Button variant="secondary" size="sm" className="w-full sm:w-auto">View Certificate</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/binder/${activeBinder.id}/week/${enrollment?.currentWeekIndex || 1}`}>
                      <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-border">
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Continue to Week {enrollment?.currentWeekIndex || 1}
                      </Button>
                    </Link>
                    <Link href={`/binder/${activeBinder.id}`}>
                      <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                        View Binder
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          </AnimatedCard>

          {isCompleted && suggestedBinders.length > 0 && (
            <AnimatedCard delay={0.2}>
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Start Something New</h4>
                  <Link href="/catalog" className="text-sm text-primary hover:underline">Browse Catalog &rarr;</Link>
                </div>
                <div className="grid-12">
                  {suggestedBinders.map(binder => (
                    <BinderCard key={binder.id} binder={binder} className="h-full text-left col-span-12 md:col-span-4 xl:col-span-3" />
                  ))}
                </div>
              </div>
            </AnimatedCard>
          )}
          </>
        ) : (
          <AnimatedCard delay={0.1}>
            <Card className="outline-dashed outline-2 bg-muted">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="bg-muted p-4 rounded-full">
                  <BookOpenIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-medium">You are not currently enrolled in any binder</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">Browse the catalog to find your next topic, or create your own!</p>
                </div>
                <div className="flex gap-3">
                  <Link href="/catalog">
                    <Button>Browse Catalog</Button>
                  </Link>
                  <Link href="/curator">
                    <Button variant="secondary">Build your own course</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}
      </section>
      {completedBinders.length > 0 && (
        <AnimatedCard delay={0.2}>
          <section className="space-y-6">
            <header>
              <h2 className="text-2xl font-display text-foreground mb-2">Completed Journeys</h2>
              <p className="text-muted-foreground">You have successfully completed {pluralize(completedBinders.length, 'binder')}!</p>
            </header>
            <div className="grid-12">
              {completedBinders.map(s => (
                 <Link key={s.id} href={`/binder/${s.id}`} className="col-span-12 md:col-span-6">
                   <div className="flex items-center gap-4 p-4 outline outline-1 -outline-offset-1 outline-border rounded-lg bg-card hover:bg-muted transition-colors cursor-pointer group">
                      <div className="bg-primary-surface p-3 rounded-full text-primary">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium group-hover:text-primary transition-colors">{s.title}</h4>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className={buttonVariants({ variant: "ghost", size: "sm", className: "ml-auto" })}>
                        View
                      </div>
                   </div>
                 </Link>
              ))}
            </div>
          </section>
        </AnimatedCard>
      )}
    </AnimatedPage>
  );
}

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
