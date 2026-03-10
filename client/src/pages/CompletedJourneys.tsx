import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Award, BookOpen } from 'lucide-react';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import { Binder } from '@/lib/types';

export default function CompletedJourneys() {
  const { enrollment, getBinderById } = useStore();
  const completedIds = enrollment?.completedBinderIds || [];
  const [resolvedBinders, setResolvedBinders] = useState<Binder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolve = async () => {
      const results: Binder[] = [];
      for (const id of completedIds) {
        const fromStore = getBinderById(id);
        if (fromStore) {
          results.push(fromStore);
        } else {
          try {
            const res = await fetch(`/api/binders/${id}`, { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              results.push(data);
            }
          } catch {
            // Skip binders that can't be fetched
          }
        }
      }
      setResolvedBinders(results);
      setLoading(false);
    };
    resolve();
  }, [completedIds.join(',')]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title="Completed Journeys"
        backHref="/"
        backLabel="Dashboard"
      />

      {resolvedBinders.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No completed journeys yet"
          description="When you finish a binder, it will appear here."
          action={
            <Link href="/catalog">
              <Button>Browse Catalog</Button>
            </Link>
          }
        />
      ) : (
        <div className="completed-journeys-grid grid-12">
          {resolvedBinders.map((binder, index) => (
            <AnimatedCard key={binder.id} delay={index * 0.05} className="col-span-12 md:col-span-6">
              <div className="completed-journey-card flex items-center gap-4 p-4 outline outline-1 -outline-offset-1 outline-border rounded-xl bg-card hover:bg-muted transition-colors group">
                <div className="bg-highlight p-3 rounded-full text-primary shrink-0">
                  <Award className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                    {binder.title}
                  </h3>
                  {binder.curator && (
                    <p className="text-xs text-muted-foreground truncate">
                      by {binder.curator.name || binder.curatorId}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/binder/${binder.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                  <Link href={`/binder/${binder.id}/completed`}>
                    <Button variant="ghost" size="sm">Certificate</Button>
                  </Link>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
