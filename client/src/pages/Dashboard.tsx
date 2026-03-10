import { useStore } from '@/lib/store';
import { Link } from 'wouter';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, CheckCircle2, Award, BookOpen, ArrowRight } from 'lucide-react';
import { BinderCard } from '@/components/BinderCard';
import { ItemListCard } from '@/components/ItemList';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import { ProOnboardingChecklist } from '@/components/ProOnboardingChecklist';
import { CreditsCard } from '@/components/CreditsCard';
import { FeedbackCard } from '@/components/FeedbackCard';
import { CuratorRecruitCard } from '@/components/CuratorRecruitCard';
import { BinderReviewStatusCard } from '@/components/BinderReviewStatusCard';
import { pluralize } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Binder } from '@/lib/types';
import { sanitizeHtml } from '@/lib/sanitize';
import { AnimatedCard, AnimatedPage } from '@/components/ui/animated-container';

export default function Dashboard() {
  const { user, enrollment, getActiveBinder, binders, getBinderById, completedStepIds, enrollmentLoading, bindersLoading, completeActiveBinder } = useStore();
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

  const completedBinders = (enrollment?.completedBinderIds || [])
    .map(id => getBinderById(id))
    .filter((s): s is typeof s & {} => !!s);

  const isCompleted = activeBinder && getOverallProgress(activeBinder.id) === 100;

  const allCompleted = binders.length > 0 && binders.every(s => enrollment?.completedBinderIds?.includes(s.id));

  if (enrollmentLoading || bindersLoading) {
    return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  }

  // Wait for full binder data to load
  if (activeBinderMetadata && !activeBinder) {
    return <div className="max-w-4xl mx-auto py-20 text-center">Loading...</div>;
  }

  const suggestedBinders = binders
    .filter(s =>
      s.visibility === 'public' &&
      !s.isDemo &&
      (!activeBinder || s.id !== activeBinder.id) &&
      !enrollment?.completedBinderIds?.includes(s.id)
    )
    .slice(0, 3);

  const myBinders = user
    ? binders.filter(b =>
        b.curatorId === user.username &&
        b.status !== 'pending_review' &&
        !(b.status === 'draft' && b.reviewNote)
      ).slice(0, 5)
    : [];

  const getBinderBadge = (b: Binder): { badge: string; badgeVariant: 'secondary' | 'success-surface' | 'warning-surface' } => {
    if (b.status === 'draft') return { badge: 'Draft', badgeVariant: 'secondary' };
    if (b.status === 'pending_review') return { badge: 'In Review', badgeVariant: 'warning-surface' };
    if (b.visibility === 'unlisted') return { badge: 'Unlisted', badgeVariant: 'secondary' };
    if (b.visibility === 'private') return { badge: 'Private', badgeVariant: 'secondary' };
    return { badge: 'Published', badgeVariant: 'success-surface' };
  };

  return (
    <AnimatedPage className="space-y-8">
      <header>
        <h1 className="text-3xl font-display text-foreground mb-1">
          {user?.name ? `Welcome back, ${user.name}` : 'Welcome back'}
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

      <div className="dashboard-grid grid-12 items-start">
        {/* Primary column */}
        <div className="dashboard-primary col-span-12 lg:col-span-8 space-y-6">
          <BinderReviewStatusCard />
          {/* Active binder card */}
          <section className="space-y-4">
            {allCompleted ? (
              <AnimatedCard delay={0.1}>
                <Card className="outline-dashed outline-2 bg-muted">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="bg-highlight p-4 rounded-full">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-medium">All Binders Completed</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">You've mastered every topic in our catalog. Amazing work!</p>
                    </div>
                    {completedBinders.length > 0 && (
                      <Link href="/completed" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                        View {pluralize(completedBinders.length, 'completed journey')} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
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
                            <div className="bg-highlight outline outline-1 -outline-offset-1 outline-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
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

                      {/* Subtle completed link */}
                      {completedBinders.length > 0 && (
                        <div className="pt-4 border-t border-border mt-6">
                          <Link href="/completed" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                            View {pluralize(completedBinders.length, 'completed journey')} <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
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
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
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
                    {completedBinders.length > 0 && (
                      <Link href="/completed" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mt-2">
                        View {pluralize(completedBinders.length, 'completed journey')} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </AnimatedCard>
            )}
          </section>

          {/* Curator recruitment card */}
          <AnimatedCard delay={0.2}>
            <CuratorRecruitCard />
          </AnimatedCard>

          {/* Binders you made */}
          {myBinders.length > 0 && (
            <AnimatedCard delay={0.25}>
              <ItemListCard
                title="Binders You Made"
                action={{ label: 'Curator Studio \u2192', href: '/curator' }}
                items={myBinders.map(b => ({
                  id: b.id,
                  href: `/curator/binder/${b.id}/edit`,
                  title: b.title,
                  ...getBinderBadge(b),
                }))}
              />
            </AnimatedCard>
          )}

          {/* Suggested binders (when not completed) */}
          {!isCompleted && !allCompleted && suggestedBinders.length > 0 && (
            <AnimatedCard delay={0.3}>
              <ItemListCard
                title="Suggested Binders"
                action={{ label: 'Browse Catalog \u2192', href: '/catalog' }}
                items={suggestedBinders.map(binder => ({
                  id: binder.id,
                  href: `/binder/${binder.id}`,
                  title: binder.title,
                  subtitle: `${binder.curator?.name || binder.curatorId} · ${binder.durationWeeks}w`,
                  avatarUrl: binder.curator?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${binder.curator?.name || binder.curatorId}`,
                  avatarFallback: binder.curator?.name || binder.curatorId,
                }))}
              />
            </AnimatedCard>
          )}
        </div>

        {/* Sidebar */}
        <aside className="dashboard-sidebar col-span-12 lg:col-span-4 space-y-6 [&>:empty]:hidden">
          <AnimatedCard delay={0.15}>
            <OnboardingChecklist />
          </AnimatedCard>
          <AnimatedCard delay={0.17}>
            <ProOnboardingChecklist />
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <CreditsCard />
          </AnimatedCard>
          <AnimatedCard delay={0.25}>
            <FeedbackCard />
          </AnimatedCard>
        </aside>
      </div>
    </AnimatedPage>
  );
}
