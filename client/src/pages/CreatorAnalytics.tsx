import { useStore } from '@/lib/store';
import { useRoute, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export default function CreatorAnalytics() {
  const [match, params] = useRoute('/creator/syllabus/:id/analytics');
  const { getSyllabusById } = useStore();
  
  const syllabus = match && params?.id ? getSyllabusById(params.id) : undefined;

  if (!syllabus) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Syllabus not found</p>
        <Link href="/creator">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Mock Analytics Data
  const analytics = {
    learnersStarted: 127,
    learnersCompleted: 43,
    completionRate: 34,
    averageProgress: 62,
    weekReach: [
      { week: 'Week 1', percentage: 100 },
      { week: 'Week 2', percentage: 62 },
      { week: 'Week 3', percentage: 47 },
      { week: 'Week 4', percentage: 34 },
    ],
    topDropoutStep: {
      weekIndex: 2,
      stepTitle: 'Read: Long industry report on AI adoption',
      reason: 'Most learners stop between Week 1 and Week 2.'
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/creator">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-serif">{syllabus.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={syllabus.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                {syllabus.status}
              </Badge>
              <span className="text-sm text-muted-foreground">Analytics Overview</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/creator/syllabus/${syllabus.id}/edit`}>
            <Button variant="outline" size="sm">Edit Syllabus</Button>
          </Link>
          <Link href={`/syllabus/${syllabus.id}`}>
            <Button variant="outline" size="sm">Preview</Button>
          </Link>
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
            <div className="text-2xl font-bold">{analytics.learnersStarted}</div>
            <p className="text-xs text-muted-foreground mt-1">+12 this week</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Learners Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.learnersCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">34% of starters</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Above average (28%)</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Progress</CardTitle>
            <BarChart2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageProgress}%</div>
            <p className="text-xs text-muted-foreground mt-1">of steps completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Drop-off Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-serif">How far learners get</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weekReach} margin={ { top: 20, right: 30, left: 0, bottom: 0 } }>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                  <XAxis 
                    dataKey="week" 
                    axisLine={false}
                    tickLine={false}
                    tick={ { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={ { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    cursor={ { fill: 'hsl(var(--muted)/0.5)' } }
                    contentStyle={ { 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    } }
                    formatter={(value) => [`${value}% Reach`]}
                  />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {analytics.weekReach.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.6)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-muted-foreground mt-6 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              {analytics.topDropoutStep.reason}
            </p>
          </CardContent>
        </Card>

        {/* Dropout Insight */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Most common dropout step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Week {analytics.topDropoutStep.weekIndex}</div>
              <h4 className="text-lg font-medium leading-tight mb-2">{analytics.topDropoutStep.stepTitle}</h4>
              <p className="text-sm text-muted-foreground">
                Consider shortening, replacing, or moving this step if it’s too heavy for most learners.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Other friction points</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">W1 – Intro Quiz</span>
                  <span className="font-mono text-orange-500">12% drop</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">W3 – Case Study Read</span>
                  <span className="font-mono text-orange-500">8% drop</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
