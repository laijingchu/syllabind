import { useStore } from '@/lib/store';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, BookOpen, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
import { BinderFilterBar } from '@/components/BinderFilterBar';
import { pluralize } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { ReviewQueueCard } from '@/components/ReviewQueueCard';
import type { ReviewQueueBinder } from '@/components/ReviewQueueCard';
import { CuratorBinderCard } from '@/components/CuratorBinderCard';
import type { Binder, Category } from '@/lib/types';

export default function CuratorDashboard() {
  const { binders, user, getReadersForBinder, batchDeleteBinders, subscriptionLimits, refreshBinders, notificationItems, acknowledgeNotifications, refreshNotifications, pendingReviewCount, isPro, featureBinderCanSubmit, featureBinderEligible } = useStore();
  const [readerCounts, setReaderCounts] = useState<Record<number, { total: number, active: number }>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeVariant, setUpgradeVariant] = useState<'curator-limit' | 'featured-listing'>('curator-limit');
  const [showReviewConfirmDialog, setShowReviewConfirmDialog] = useState(false);
  const [reviewChecks, setReviewChecks] = useState({ expert: false, vetted: false });
  const [pendingPublishId, setPendingPublishId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories on mount
  useEffect(() => {
    refreshBinders();
  }, []);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  // Admin: toggle between own binders, all binders, and review queue
  const isAdmin = user?.isAdmin === true;
  const [adminView, setAdminView] = useState<'mine' | 'others' | 'review'>('mine');
  const [allBinders, setAllBinders] = useState<Binder[]>([]);

  // Review queue state (admin only)
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueBinder[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectBinderId, setRejectBinderId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewActionInProgress, setReviewActionInProgress] = useState<number | null>(null);

  // Filter binders by current user's username
  const myBinders = binders.filter(s => s.curatorId === user?.username);

  // Build slug→id map for category filtering
  const categorySlugToId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of categories) map[cat.slug] = cat.id;
    return map;
  }, [categories]);

  // The displayed list depends on admin toggle + all filters (client-side)
  const otherBinders = allBinders.filter(s => s.curatorId !== user?.username);
  const baseBinders = (isAdmin && adminView === 'others') ? otherBinders : myBinders;
  const displayedBinders = useMemo(() => {
    let result = baseBinders;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.title.toLowerCase().includes(q));
    }

    // Visibility filter (empty = all)
    if (selectedVisibility) {
      if (selectedVisibility === 'draft') {
        result = result.filter(s => s.status === 'draft');
      } else if (selectedVisibility === 'pending_review') {
        result = result.filter(s => s.status === 'pending_review');
      } else {
        result = result.filter(s => s.status === 'published' && s.visibility === selectedVisibility);
      }
    }

    // Category filter
    if (selectedCategories.length > 0) {
      const catIds = new Set(selectedCategories.map(slug => categorySlugToId[slug]).filter(Boolean));
      result = result.filter(s => s.categoryId && catIds.has(s.categoryId));
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'popular') {
        return (readerCounts[b.id]?.total || 0) - (readerCounts[a.id]?.total || 0);
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      // newest (default)
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });

    return result;
  }, [baseBinders, searchQuery, selectedVisibility, selectedCategories, categorySlugToId, sortBy, readerCounts]);

  // Fetch all binders when admin toggles "All Binders"
  const fetchAllBinders = useCallback(async () => {
    try {
      const res = await fetch('/api/curator/binders?all=true', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAllBinders(data);
      }
    } catch (err) {
      console.error('Failed to fetch all binders:', err);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && adminView === 'others') {
      fetchAllBinders();
    }
  }, [isAdmin, adminView, fetchAllBinders]);

  // Fetch review queue when admin switches to review tab
  const fetchReviewQueue = useCallback(async () => {
    setReviewLoading(true);
    try {
      const res = await fetch('/api/admin/review-queue', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReviewQueue(data);
    } catch {
      toast({ title: "Error", description: "Failed to load review queue.", variant: "destructive" });
    } finally {
      setReviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && adminView === 'review') {
      fetchReviewQueue();
    }
  }, [isAdmin, adminView, fetchReviewQueue]);

  // Fetch reader counts for each binder
  useEffect(() => {
    const fetchCounts = async () => {
      const counts: Record<number, { total: number, active: number }> = {};

      for (const binder of myBinders) {
        const { classmates, totalEnrolled } = await getReadersForBinder(binder.id);
        const activeReaders = (classmates || []).filter(l => l.status === 'in-progress');
        counts[binder.id] = {
          total: totalEnrolled,
          active: activeReaders.length
        };
      }

      setReaderCounts(counts);
    };

    if (myBinders.length > 0) {
      fetchCounts();
    }
  }, [myBinders.length]);

  // Reset selection when binders change
  useEffect(() => {
    setSelectedIds([]);
  }, [displayedBinders.length, adminView]);

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === displayedBinders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedBinders.map(s => s.id));
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      await batchDeleteBinders(selectedIds);
      setSelectedIds([]);
      setShowDeleteDialog(false);
      // Refresh all binders list if admin is viewing all
      if (isAdmin && adminView === 'others') {
        fetchAllBinders();
      }
    } catch (err) {
      console.error('Failed to delete binders:', err);
      alert('Failed to delete binders. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (id: number, visibility: string) => {
    try {
      const res = await fetch(`/api/binders/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ visibility }),
      });
      if (!res.ok) throw new Error('Failed to publish');
      const updated = await res.json();
      await refreshBinders();
      if (updated.status === 'pending_review') {
        toast({ title: "Submitted for Review", description: "Your binder has been submitted for admin review." });
      } else if (updated.status === 'published') {
        toast({ title: "Binder Published", description: `Published as ${visibility}.` });
      } else {
        toast({ title: "Status Updated", description: `Binder is now ${updated.status}.` });
      }
    } catch {
      toast({ title: "Publish failed", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleWithdraw = async (id: number) => {
    try {
      const res = await fetch(`/api/binders/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to withdraw');
      await refreshBinders();
      toast({ title: "Submission Withdrawn", description: "Moved back to draft." });
    } catch {
      toast({ title: "Withdraw failed", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      const res = await fetch(`/api/binders/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to unpublish');
      await refreshBinders();
      toast({ title: "Binder Unpublished", description: "Moved back to draft." });
    } catch {
      toast({ title: "Unpublish failed", description: "Something went wrong.", variant: "destructive" });
    }
  };

  // Review queue actions
  const handleReviewApprove = async (id: number) => {
    setReviewActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/binders/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to approve');
      setReviewQueue(prev => prev.filter(b => b.id !== id));
      toast({ title: "Binder Approved", description: "The binder is now published." });
    } catch {
      toast({ title: "Error", description: "Failed to approve binder.", variant: "destructive" });
    } finally {
      setReviewActionInProgress(null);
    }
  };

  const handleReviewRejectConfirm = async () => {
    if (!rejectBinderId || !rejectReason.trim()) return;
    setReviewActionInProgress(rejectBinderId);
    try {
      const res = await fetch(`/api/admin/binders/${rejectBinderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      setReviewQueue(prev => prev.filter(b => b.id !== rejectBinderId));
      toast({ title: "Binder Rejected", description: "The curator will see your feedback." });
    } catch {
      toast({ title: "Error", description: "Failed to reject binder.", variant: "destructive" });
    } finally {
      setReviewActionInProgress(null);
      setRejectDialogOpen(false);
      setRejectBinderId(null);
      setRejectReason('');
    }
  };

  return (
    <AnimatedPage className="space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display mb-1">Curator Studio</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your binders and track reader progress.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/curator/profile">
            <Button variant="secondary" size="sm">
              Edit Profile
            </Button>
          </Link>
          {subscriptionLimits?.canCreateMore !== false ? (
            <Link href="/curator/binder/new/edit">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />Create New
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={() => setShowUpgradePrompt(true)}>
              <Plus className="mr-2 h-4 w-4" />Create New
            </Button>
          )}
        </div>
      </div>

      {adminView !== 'review' && (
        <BinderFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          visibility={selectedVisibility}
          onVisibilityChange={setSelectedVisibility}
          visibilityOptions={[
            { value: '', label: 'All' },
            { value: 'draft', label: 'Draft' },
            { value: 'pending_review', label: 'Pending Review' },
            { value: 'public', label: 'Public' },
            { value: 'unlisted', label: 'Unlisted' },
            { value: 'private', label: 'Private' },
          ]}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { value: 'newest', label: 'Newest' },
            { value: 'popular', label: 'Most Popular' },
            { value: 'alphabetical', label: 'A-Z' },
          ]}
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          resultCount={displayedBinders.length}
        />
      )}

      {/* Admin toggle bar */}
      {isAdmin && (
        <div className="admin-toggle flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Admin View</span>
          <div className="flex items-center gap-1 ml-auto bg-secondary rounded-md p-0.5">
            <button
              onClick={() => setAdminView('mine')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${adminView === 'mine' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              My Binders
            </button>
            <button
              onClick={() => setAdminView('others')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${adminView === 'others' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Others
            </button>
            <button
              onClick={() => setAdminView('review')}
              className={`relative px-3 py-1 text-xs font-medium rounded transition-colors ${adminView === 'review' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Review Queue
              {pendingReviewCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-danger-inverted" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Review Queue tab content */}
      {adminView === 'review' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Pending Review</h2>
            <Button variant="secondary" size="sm" onClick={async () => { await acknowledgeNotifications(); await refreshNotifications(); }}>
              Mark all as read
            </Button>
          </div>

          {reviewLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reviewQueue.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">All clear!</p>
              <p className="text-sm mt-1">No binders pending review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewQueue.map(binder => (
                <ReviewQueueCard
                  key={binder.id}
                  binder={binder}
                  actionInProgress={reviewActionInProgress === binder.id}
                  onApprove={handleReviewApprove}
                  onReject={(id) => {
                    setRejectBinderId(id);
                    setRejectDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Notification dismiss banner */}
          {notificationItems.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted">
              <span className="text-sm">{notificationItems.length} binder(s) reviewed</span>
              <Button variant="ghost" size="sm" onClick={async () => { await acknowledgeNotifications(); await refreshNotifications(); }}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Selection toolbar */}
          {displayedBinders.length > 0 && (
            <div className="selection-toolbar flex flex-wrap items-center justify-between gap-2 px-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.length === displayedBinders.length && displayedBinders.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-xs sm:text-sm text-muted-foreground cursor-pointer">
                  {selectedIds.length === 0
                    ? 'Select all'
                    : selectedIds.length === displayedBinders.length
                      ? 'Deselect all'
                      : `${selectedIds.length} selected`}
                </label>
              </div>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete ({selectedIds.length})</span>
                  <span className="sm:hidden">({selectedIds.length})</span>
                </Button>
              )}
            </div>
          )}

          {/* Empty state */}
          {displayedBinders.length === 0 ? (
            <AnimatedCard delay={0.1}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="bg-highlight p-4 rounded-full">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-display">{adminView === 'others' ? 'No binders by other curators' : 'No binders yet'}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {adminView === 'others'
                        ? 'There are no binders created by other users yet.'
                        : 'Create your first Binder to start sharing knowledge with readers. Use AI assistance to build a structured multi-week learning experience.'}
                    </p>
                  </div>
                  {adminView === 'mine' && (
                    <Link href="/curator/binder/new/edit">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Binder
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>
          ) : (
            <div className="grid gap-4">
              {displayedBinders.map((binder, index) => (
              <AnimatedCard key={binder.id} delay={0.05 * index}>
                <CuratorBinderCard
                  binder={binder}
                  selected={selectedIds.includes(binder.id)}
                  onToggleSelect={handleToggleSelect}
                  readerCount={readerCounts[binder.id]}
                  isAdmin={isAdmin}
                  isPro={isPro}
                  featureBinderCanSubmit={featureBinderCanSubmit}
                  featureBinderEligible={featureBinderEligible}
                  isOtherCurator={adminView === 'others' && binder.curatorId !== user?.username}
                  hasApprovalNotification={notificationItems.some(n => n.binderId === binder.id && n.type === 'approved')}
                  onPublish={handlePublish}
                  onUnpublish={handleUnpublish}
                  onWithdraw={handleWithdraw}
                  onRequestReview={(id) => { setPendingPublishId(id); setShowReviewConfirmDialog(true); }}
                  onUpgrade={() => {
                    if (featureBinderEligible && !featureBinderCanSubmit) {
                      toast({ title: 'Limit reached', description: 'Free accounts can submit one binder for feature review.', variant: 'destructive' });
                    } else {
                      setUpgradeVariant('featured-listing'); setShowUpgradePrompt(true);
                    }
                  }}
                />
              </AnimatedCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* Review confirmation dialog */}
      <AlertDialog open={showReviewConfirmDialog} onOpenChange={(open) => { if (!open) { setShowReviewConfirmDialog(false); setReviewChecks({ expert: false, vetted: false }); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Review</AlertDialogTitle>
            <AlertDialogDescription>
              Public binders are reviewed by an admin before being featured in the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={reviewChecks.expert} onCheckedChange={(v) => setReviewChecks(prev => ({ ...prev, expert: !!v }))} />
              <span className="text-sm">I am knowledgeable in this domain</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={reviewChecks.vetted} onCheckedChange={(v) => setReviewChecks(prev => ({ ...prev, vetted: !!v }))} />
              <span className="text-sm">The content and resources are hand-crafted and vetted</span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!reviewChecks.expert || !reviewChecks.vetted}
              onClick={() => { if (pendingPublishId !== null) handlePublish(pendingPublishId, 'public'); setShowReviewConfirmDialog(false); setReviewChecks({ expert: false, vetted: false }); setPendingPublishId(null); }}
            >
              Submit for Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review reject dialog */}
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
              onClick={handleReviewRejectConfirm}
              disabled={!rejectReason.trim() || reviewActionInProgress !== null}
            >
              Reject with Feedback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pluralize(selectedIds.length, 'binder', 'binders')}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {pluralize(selectedIds.length, 'binder', 'binders')} and all associated enrollments, submissions, and progress data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-danger-inverted text-foreground-inverted hover:bg-danger-inverted/90"
            >
              {isDeleting ? 'Deleting...' : `Delete ${pluralize(selectedIds.length, 'binder', 'binders')}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        variant={upgradeVariant}
        returnTo="/curator"
      />
    </AnimatedPage>
  );
}
