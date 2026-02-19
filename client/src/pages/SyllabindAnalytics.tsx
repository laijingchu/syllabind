import { useStore } from '@/lib/store';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import { pluralize } from '@/lib/utils';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AnalyticsData {
  learnersStarted: number;
  learnersCompleted: number;
  completionRate: number;
  averageProgress: number;
  weekReach: Array<{ week: string; weekIndex: number; percentage: number; learnerCount: number; learnerNames: string[] }>;
  stepDropoff: Array<{ stepId: number; weekIndex: number; stepTitle: string; dropoffRate: number; completionCount: number }>;
  topDropoutStep: { weekIndex: number; stepTitle: string; dropoffRate: number } | null;
}

export default function SyllabindAnalytics() {
  const [match, params] = useRoute('/creator/syllabus/:id/analytics');
  const { getSyllabusById } = useStore();
  const syllabusId = match && params?.id ? parseInt(params.id) : undefined;

  const syllabus = syllabusId ? getSyllabusById(syllabusId) : undefined;

  // Fetch analytics data from API
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['syllabus-analytics', syllabusId],
    queryFn: async () => {
      const res = await fetch(`/api/syllabinds/${syllabusId}/analytics`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    enabled: !!syllabusId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  if (!syllabus) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Syllabind not found</p>
        <Link href="/creator">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Failed to load analytics</p>
        <Link href="/creator">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Get top friction points (steps with highest dropoff, excluding top one)
  const frictionPoints = analytics?.stepDropoff
    ?.filter(s => s.dropoffRate > 0 && s.stepTitle !== analytics?.topDropoutStep?.stepTitle)
    ?.sort((a, b) => b.dropoffRate - a.dropoffRate)
    ?.slice(0, 3) ?? [];

  return (
    <AnimatedPage className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <Link href="/creator">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display">{syllabus.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={syllabus.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                {syllabus.status}
              </Badge>
              <span className="text-sm text-muted-foreground">Analytics Overview</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/creator/syllabus/${syllabus.id}/edit`}>
              <Button variant="outline" size="sm">Edit Syllabind</Button>
            </Link>
            <Link href={`/syllabus/${syllabus.id}`}>
              <Button variant="outline" size="sm">Preview</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Learners Started</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{analytics?.learnersStarted ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">total enrollments</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Learners Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{analytics?.learnersCompleted ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {analytics && analytics.learnersStarted > 0
                ? `${analytics.completionRate}% of starters`
                : 'no enrollments yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{analytics?.completionRate ?? 0}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">finished the syllabind</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Progress</CardTitle>
            <BarChart2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{analytics?.averageProgress ?? 0}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">of steps completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Drop-off Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display">How far learners get</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : analytics?.weekReach && analytics.weekReach.length > 0 ? (
              <>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.weekReach} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                      <XAxis
                        dataKey="week"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-[250px]">
                              <div className="font-medium mb-1">{data.week}</div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {data.percentage}% reach ({data.learnerCount} learners)
                              </div>
                              {data.learnerNames && data.learnerNames.length > 0 && (
                                <div className="border-t border-border pt-2 mt-2">
                                  <div className="text-xs text-muted-foreground mb-1">Currently at this week:</div>
                                  <div className="text-xs space-y-0.5 max-h-[120px] overflow-y-auto">
                                    {data.learnerNames.slice(0, 10).map((name: string, i: number) => (
                                      <div key={i} className="truncate">{name}</div>
                                    ))}
                                    {data.learnerNames.length > 10 && (
                                      <div className="text-muted-foreground italic">
                                        +{data.learnerNames.length - 10} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                        {analytics.weekReach.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.6)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {analytics.topDropoutStep && (
                  <p className="text-sm text-muted-foreground mt-6 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Biggest drop happens at Week {analytics.topDropoutStep.weekIndex} ({analytics.topDropoutStep.dropoffRate}% dropoff)
                  </p>
                )}
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No enrollment data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dropout Insight */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg font-display">Most common dropout step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : analytics?.topDropoutStep ? (
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">
                  Week {analytics.topDropoutStep.weekIndex}
                </div>
                <h4 className="text-lg font-medium leading-tight mb-2">{analytics.topDropoutStep.stepTitle}</h4>
                <p className="text-sm text-muted-foreground">
                  {analytics.topDropoutStep.dropoffRate}% of learners drop off here. Consider shortening or moving this step.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <h4 className="text-lg font-medium leading-tight mb-2">No significant dropoff detected</h4>
                <p className="text-sm text-muted-foreground">
                  Learners are progressing smoothly through your content.
                </p>
              </div>
            )}

            {!isLoading && frictionPoints.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Other friction points</h4>
                <div className="space-y-3">
                  {frictionPoints.map((step) => (
                    <div key={step.stepId} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[180px]">
                        W{step.weekIndex} – {step.stepTitle}
                      </span>
                      <span className="font-mono text-orange-500">{step.dropoffRate}% drop</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && frictionPoints.length === 0 && analytics?.learnersStarted === 0 && (
              <div className="text-sm text-muted-foreground">
                Friction points will appear once learners start enrolling.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}
