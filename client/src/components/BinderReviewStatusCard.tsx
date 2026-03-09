import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function BinderReviewStatusCard() {
  const { user, binders } = useStore();

  if (!user) return null;

  const pendingBinders = binders.filter(
    (b) => b.curatorId === user.username && b.status === 'pending_review'
  );
  const revertedBinders = binders.filter(
    (b) => b.curatorId === user.username && b.status === 'draft' && b.reviewNote
  );
  const reviewBinders = [...pendingBinders, ...revertedBinders];

  if (reviewBinders.length === 0 && !user.isAdmin) return null;

  return (
    <Card className="binder-review-status">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Binder Review Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviewBinders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No binders pending review.</p>
        ) : (
          <div className="space-y-4">
            {reviewBinders.map((binder) => {
              const isPending = binder.status === 'pending_review';
              return (
                <div key={binder.id} className="space-y-1.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <Badge variant="warning-surface" className="text-xs shrink-0">
                      {isPending ? 'Pending Review' : 'Changes Requested'}
                    </Badge>
                    <Link
                      href={`/curator/binder/${binder.id}/edit`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {binder.title}
                    </Link>
                    {isPending && binder.submittedAt && (
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        Submitted {formatDistanceToNow(new Date(binder.submittedAt), { addSuffix: true })}
                      </span>
                    )}
                    {!isPending && binder.reviewedAt && (
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        Reviewed {formatDistanceToNow(new Date(binder.reviewedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {binder.reviewNote && (
                    <div className="text-xs text-muted-foreground bg-background rounded-md p-2.5 mt-1.5">
                      {binder.reviewNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </CardContent>
      </Card>
  );
}
