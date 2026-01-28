import { useStore } from '@/lib/store';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Eye, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { pluralize } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';

export default function CreatorDashboard() {
  const { syllabi, user, getLearnersForSyllabus } = useStore();
  const [learnerCounts, setLearnerCounts] = useState<Record<number, { total: number, active: number }>>({});

  // Filter syllabi by current user's username
  const mySyllabi = syllabi.filter(s => s.creatorId === user?.username);

  // Fetch learner counts for each syllabus
  useEffect(() => {
    const fetchCounts = async () => {
      const counts: Record<number, { total: number, active: number }> = {};

      for (const syllabus of mySyllabi) {
        const learners = await getLearnersForSyllabus(syllabus.id);
        const activeLearners = learners.filter(l => l.status === 'in-progress');
        counts[syllabus.id] = {
          total: learners.length,
          active: activeLearners.length
        };
      }

      setLearnerCounts(counts);
    };

    if (mySyllabi.length > 0) {
      fetchCounts();
    }
  }, [mySyllabi.length]); 

  return (
    <AnimatedPage className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif mb-1">Curator Studio</h1>
          <p className="text-muted-foreground">Manage your syllabi and track learner progress.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Link href="/creator/profile">
            <Button variant="outline" size="sm" className="sm:size-default">
              Edit Profile
            </Button>
          </Link>
          <Link href="/creator/syllabus/new">
            <Button size="sm" className="sm:size-default">
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {mySyllabi.map((syllabus, index) => (
          <AnimatedCard key={syllabus.id} delay={0.05 * index}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <Badge variant="secondary" className="capitalize shrink-0 mb-1">
                    {syllabus.status}
                  </Badge>
                  <h3 className="font-medium text-base sm:text-lg truncate">{syllabus.title}</h3>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {pluralize(syllabus.durationWeeks, 'week')} • {syllabus.audienceLevel} • Updated {syllabus.updatedAt ? formatDistanceToNow(new Date(syllabus.updatedAt), { addSuffix: true }) : 'recently'}
                  </div>
                  {/* Mobile learner count */}
                  <div className="text-xs text-muted-foreground sm:hidden">
                    {pluralize(learnerCounts[syllabus.id]?.total || 0, 'Learner')} • {pluralize(learnerCounts[syllabus.id]?.active || 0, 'Active')}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="mr-4 text-right hidden md:block">
                    <div className="text-sm font-medium">{pluralize(learnerCounts[syllabus.id]?.total || 0, 'Learner')}</div>
                    <div className="text-xs text-muted-foreground">{pluralize(learnerCounts[syllabus.id]?.active || 0, 'Active')}</div>
                  </div>
                  <Link href={`/creator/syllabus/${syllabus.id}/analytics`}>
                    <Button variant="outline" size="sm">
                      <BarChart2 className="h-4 w-4 sm:mr-2 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Analytics</span>
                    </Button>
                  </Link>
                  <Link href={`/creator/syllabus/${syllabus.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit2 className="h-4 w-4 sm:mr-2 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                  <Link href={`/syllabus/${syllabus.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 sm:mr-2 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        ))}
      </div>
    </AnimatedPage>
  );
}
