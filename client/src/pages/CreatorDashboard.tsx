import { useStore } from '@/lib/store';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function CreatorDashboard() {
  const { syllabi } = useStore();
  
  // In a real app filter by creatorId. Here we show all or just mock creator's.
  // Let's assume MOCK_USER matches creator of syllabi for now or just show all.
  const mySyllabi = syllabi; 

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif mb-1">Creator Studio</h1>
          <p className="text-muted-foreground">Manage your syllabi and track learner progress.</p>
        </div>
        <Link href="/creator/syllabus/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New Syllabind
          </Button>
        </Link>
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
                  {syllabus.durationWeeks} weeks • {syllabus.audienceLevel} • Last updated today
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="mr-6 text-right hidden md:block">
                  <div className="text-sm font-medium">42 Learners</div>
                  <div className="text-xs text-muted-foreground">12 Active</div>
                </div>
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
