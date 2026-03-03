import { useStore } from '@/lib/store';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, BarChart2, Trash2, BookOpen, Shield, ChevronDown, Globe, EyeOff, Lock, Eye, Loader2, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BinderFilterBar } from '@/components/sections/BinderFilterBar';
import { pluralize } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import type { Binder, Category } from '@/lib/types';

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

export default function CuratorDashboard() {
  const { binders, user, getReadersForBinder, batchDeleteBinders, subscriptionLimits, refreshBinders, notificationItems, acknowledgeNotifications, refreshNotifications, pendingReviewCount } = useStore();
  const [readerCounts, setReaderCounts] = useState<Record<number, { total: number, active: number }>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
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
  const [reviewQueue, setReviewQueue] = useState<QueueBinder[]>([]);
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
    <AnimatedPage className="space-y-4 sm:space-y-8 max-w-5xl mx-auto px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display mb-1">Curator Studio</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your binders and track reader progress.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/curator/profile">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
          {subscriptionLimits?.canCreateMore !== false ? (
            <Link href="/curator/binder/new">
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
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
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
            <Button variant="outline" size="sm" onClick={async () => { await acknowledgeNotifications(); await refreshNotifications(); }}>
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
                      <Link href={`/curator/binder/${binder.id}/edit`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/binder/${binder.id}?preview=true`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Eye className="h-4 w-4" /> Preview
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleReviewApprove(binder.id)}
                        disabled={reviewActionInProgress === binder.id}
                        className="gap-1.5"
                      >
                        {reviewActionInProgress === binder.id ? (
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
                        disabled={reviewActionInProgress === binder.id}
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
        </div>
      ) : (
        <>
          {/* Notification dismiss banner */}
          {notificationItems.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
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
                  <div className="bg-primary/10 p-4 rounded-full">
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
                    <Link href="/curator/binder/new">
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
              {displayedBinders.map((binder, index) => {
              const isOtherCurator = adminView === 'others' && binder.curatorId !== user?.username;
              return (
              <AnimatedCard key={binder.id} delay={0.05 * index}>
                <Card className={`relative hover:shadow-md transition-shadow cursor-pointer ${selectedIds.includes(binder.id) ? 'ring-2 ring-primary' : ''}`}>
                  <Link href={`/curator/binder/${binder.id}/edit`} className="absolute inset-0 z-0" aria-label={`Edit ${binder.title}`} />
                  <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="relative z-10 flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                      <Checkbox
                        checked={selectedIds.includes(binder.id)}
                        onCheckedChange={() => handleToggleSelect(binder.id)}
                        className="mt-1 shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {binder.status === 'published' ? (
                            binder.visibility === 'unlisted' ? (
                              <Badge variant="secondary" className="shrink-0">
                                Unlisted
                              </Badge>
                            ) : binder.visibility === 'private' ? (
                              <Badge variant="secondary" className="shrink-0">
                                Private
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="shrink-0">
                                Published
                              </Badge>
                            )
                          ) : binder.status === 'pending_review' ? (
                            <Badge variant="outline" className="shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                              Pending Review
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shrink-0">
                              Draft
                            </Badge>
                          )}
                          {isOtherCurator && (
                            <Badge variant="outline" className="text-xs">
                              by {binder.curator?.name || binder.curatorId}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-sm sm:text-lg leading-tight">{binder.title}</h3>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {pluralize(binder.durationWeeks, 'week')} • {binder.audienceLevel}
                          <span className="hidden sm:inline"> • Updated {binder.updatedAt ? formatDistanceToNow(new Date(binder.updatedAt), { addSuffix: true }) : 'recently'}</span>
                        </div>
                        {binder.reviewNote && binder.status === 'draft' && (
                          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">
                            Review feedback: {binder.reviewNote}
                          </div>
                        )}
                        {binder.status === 'published' && notificationItems.some(n => n.binderId === binder.id && n.type === 'approved') && (
                          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 mt-1">
                            Approved and published!
                          </div>
                        )}
                        {/* Mobile reader count */}
                        <div className="text-xs text-muted-foreground sm:hidden md:hidden">
                          {pluralize(readerCounts[binder.id]?.total || 0, 'Reader')} • {pluralize(readerCounts[binder.id]?.active || 0, 'Active')}
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto sm:ml-0">
                      <div className="mr-2 sm:mr-4 text-right hidden md:block">
                        <div className="text-sm font-medium">{pluralize(readerCounts[binder.id]?.total || 0, 'Reader')}</div>
                        <div className="text-xs text-muted-foreground">{pluralize(readerCounts[binder.id]?.active || 0, 'Active')}</div>
                      </div>
                      {binder.status === 'published' ? (
                        <Button variant="secondary" size="sm" className="h-8 px-3" onClick={() => handleUnpublish(binder.id)}>
                          Unpublish
                        </Button>
                      ) : binder.status === 'pending_review' && !isAdmin ? (
                        <Button variant="secondary" size="sm" className="h-8 px-3" onClick={() => handleWithdraw(binder.id)}>
                          Withdraw from Review
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="h-8 px-2 sm:px-3 gap-1.5">
                              Publish <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => isAdmin ? handlePublish(binder.id, 'public') : (() => { setPendingPublishId(binder.id); setShowReviewConfirmDialog(true); })()}>
                              <Globe className="h-4 w-4 mr-2" /> Public
                              <span className="ml-auto text-xs text-muted-foreground">{isAdmin ? 'Catalog' : 'To be featured'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePublish(binder.id, 'unlisted')}>
                              <EyeOff className="h-4 w-4 mr-2" /> Unlisted
                              <span className="ml-auto text-xs text-muted-foreground">Link only</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePublish(binder.id, 'private')}>
                              <Lock className="h-4 w-4 mr-2" /> Private
                              <span className="ml-auto text-xs text-muted-foreground">Only you</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Link href={`/curator/binder/${binder.id}/edit`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={binder.status === 'published' ? `/binder/${binder.id}` : `/binder/${binder.id}?preview=true`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/curator/binder/${binder.id}/analytics`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
              );
            })}
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : `Delete ${pluralize(selectedIds.length, 'binder', 'binders')}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        variant="curator-limit"
        returnTo="/curator"
      />
    </AnimatedPage>
  );
}
