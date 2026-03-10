import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Loader2, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ReviewQueueBinder {
  id: number;
  title: string;
  description: string;
  audienceLevel: string;
  durationWeeks: number;
  visibility: string;
  submittedAt: string | null;
  curator?: {
    name: string | null;
    username: string;
    avatarUrl: string | null;
  };
}

interface ReviewQueueCardProps {
  binder: ReviewQueueBinder;
  actionInProgress?: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function ReviewQueueCard({ binder, actionInProgress, onApprove, onReject }: ReviewQueueCardProps) {
  const [, setLocation] = useLocation();
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(`/curator/binder/${binder.id}/edit`)}>
      <CardContent className="review-queue-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {binder.curator && (
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={binder.curator.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${binder.curator.name}`} />
              <AvatarFallback>{binder.curator.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <h3 className="font-medium text-sm sm:text-base leading-tight truncate">{binder.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">
                by {binder.curator?.name || 'Unknown'}
              </span>
              <Badge variant="secondary" className="text-xs">{binder.visibility}</Badge>
              <Badge variant="secondary" className="text-xs">{binder.audienceLevel}</Badge>
              {binder.submittedAt && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(binder.submittedAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <Link href={`/curator/binder/${binder.id}/edit`}>
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/binder/${binder.id}?preview=true`}>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Eye className="h-4 w-4" /> Preview
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => onApprove(binder.id)}
            disabled={actionInProgress}
            className="gap-1.5"
          >
            {actionInProgress ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onReject(binder.id)}
            disabled={actionInProgress}
            className="gap-1.5"
          >
            <XCircle className="h-4 w-4" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
