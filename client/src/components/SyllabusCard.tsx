import { Link } from 'wouter';
import { Syllabus } from '@/lib/types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, pluralize } from '@/lib/utils';
import { format } from 'date-fns';

interface SyllabusCardProps {
  syllabus: Syllabus;
  className?: string;
}

export function SyllabusCard({ syllabus, className }: SyllabusCardProps) {
  // Determine if we should show "Updated" or "Created"
  const dateToShow = syllabus.updatedAt || syllabus.createdAt;
  const isUpdated = syllabus.updatedAt && syllabus.createdAt &&
    new Date(syllabus.updatedAt).getTime() !== new Date(syllabus.createdAt).getTime();

  return (
    <Card className={cn("group overflow-hidden transition-all hover:shadow-md border-border/60", className)}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="font-normal mb-2">
            {syllabus.audienceLevel}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {pluralize(syllabus.durationWeeks, 'week')}
          </span>
        </div>
        <h3 className="text-xl font-serif font-medium leading-tight group-hover:text-primary transition-colors">
          {syllabus.title}
        </h3>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div
          className="text-sm text-muted-foreground line-clamp-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: syllabus.description }}
        />
        {dateToShow && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {isUpdated ? 'Updated' : 'Created'} {format(new Date(dateToShow), 'MMM d, yyyy')}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/syllabus/${syllabus.id}`}>
           <Button variant="outline" className="w-full justify-between group-hover:border-primary/50 group-hover:text-primary transition-colors">
             View Syllabus
             <ArrowRight className="h-4 w-4 ml-2 opacity-50 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
           </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
