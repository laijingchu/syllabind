import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/sections/PageHeader';
import { Loader2, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

interface QueueBinder {
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

export default function AdminReviewQueue() {
  const { user } = useStore();
  const [queue, setQueue] = useState<QueueBinder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectBinderId, setRejectBinderId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/admin/review-queue', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setQueue(data);
    } catch {
      toast({ title: "Error", description: "Failed to load review queue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id: number) => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/binders/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to approve');
      setQueue(prev => prev.filter(b => b.id !== id));
      toast({ title: "Binder Approved", description: "The binder is now published." });
    } catch {
      toast({ title: "Error", description: "Failed to approve binder.", variant: "destructive" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectBinderId || !rejectReason.trim()) return;
    setActionInProgress(rejectBinderId);
    try {
      const res = await fetch(`/api/admin/binders/${rejectBinderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      setQueue(prev => prev.filter(b => b.id !== rejectBinderId));
      toast({ title: "Binder Rejected", description: "The curator will see your feedback." });
    } catch {
      toast({ title: "Error", description: "Failed to reject binder.", variant: "destructive" });
    } finally {
      setActionInProgress(null);
      setRejectDialogOpen(false);
      setRejectBinderId(null);
      setRejectReason('');
    }
  };

  if (!user?.isAdmin) {
    return <div className="text-center py-12 text-muted-foreground">Access denied.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Review Queue" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">All clear!</p>
          <p className="text-sm mt-1">No binders pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(binder => (
            <Card key={binder.id}>
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
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
                      <Badge variant="outline" className="text-xs">{binder.visibility}</Badge>
                      <Badge variant="outline" className="text-xs">{binder.audienceLevel}</Badge>
                      {binder.submittedAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(binder.submittedAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/binder/${binder.id}?preview=true`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Eye className="h-4 w-4" /> Preview
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(binder.id)}
                    disabled={actionInProgress === binder.id}
                    className="gap-1.5"
                  >
                    {actionInProgress === binder.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setRejectBinderId(binder.id);
                      setRejectDialogOpen(true);
                    }}
                    disabled={actionInProgress === binder.id}
                    className="gap-1.5"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Binder</AlertDialogTitle>
            <AlertDialogDescription>
              Provide feedback to the curator explaining why this binder was not approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRejectReason(''); setRejectBinderId(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || actionInProgress !== null}
            >
              Reject with Feedback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
