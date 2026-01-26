import { useStore } from '@/lib/store';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Eye, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { pluralize } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif mb-1">Curator Studio</h1>
          <p className="text-muted-foreground">Manage your syllabi and track learner progress.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/creator/profile">
            <Button variant="outline">
              Edit Profile
            </Button>
          </Link>
          <Link href="/creator/syllabus/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create New Syllabind
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {mySyllabi.map(syllabus => (
          <Card key={syllabus.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{syllabus.title}</h3>
                  <Badge variant={syllabus.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                    {syllabus.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {pluralize(syllabus.durationWeeks, 'week')} • {syllabus.audienceLevel} • Updated {syllabus.updatedAt ? formatDistanceToNow(new Date(syllabus.updatedAt), { addSuffix: true }) : 'recently'}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="mr-6 text-right hidden md:block">
                  <div className="text-sm font-medium">{pluralize(learnerCounts[syllabus.id]?.total || 0, 'Learner')}</div>
                  <div className="text-xs text-muted-foreground">{pluralize(learnerCounts[syllabus.id]?.active || 0, 'Active')}</div>
                </div>
                <Link href={`/creator/syllabus/${syllabus.id}/analytics`}>
                  <Button variant="outline" size="sm">
                    <BarChart2 className="mr-2 h-3 w-3" /> Analytics
                  </Button>
                </Link>
                <Link href={`/creator/syllabus/${syllabus.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit2 className="mr-2 h-3 w-3" /> Edit
                  </Button>
                </Link>
                <Link href={`/syllabus/${syllabus.id}`}>
                  <Button variant="ghost" size="sm">
                     <Eye className="mr-2 h-3 w-3" /> Preview
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
