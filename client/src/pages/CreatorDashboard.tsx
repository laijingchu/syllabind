import { useStore } from '@/lib/store';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Eye, BarChart2, Trash2, BookOpen, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { pluralize } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import type { Syllabus } from '@/lib/types';

export default function CreatorDashboard() {
  const { syllabinds, user, getLearnersForSyllabus, batchDeleteSyllabinds, subscriptionLimits } = useStore();
  const [learnerCounts, setLearnerCounts] = useState<Record<number, { total: number, active: number }>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Admin: toggle between own syllabinds and all syllabinds
  const isAdmin = user?.isAdmin === true;
  const [showAll, setShowAll] = useState(false);
  const [allSyllabinds, setAllSyllabinds] = useState<Syllabus[]>([]);

  // Filter syllabinds by current user's username
  const mySyllabinds = syllabinds.filter(s => s.creatorId === user?.username);

  // The displayed list depends on admin toggle
  const otherSyllabinds = allSyllabinds.filter(s => s.creatorId !== user?.username);
  const displayedSyllabinds = (isAdmin && showAll) ? otherSyllabinds : mySyllabinds;

  // Fetch all syllabinds when admin toggles "All Syllabinds"
  const fetchAllSyllabinds = useCallback(async () => {
    try {
      const res = await fetch('/api/creator/syllabinds?all=true', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAllSyllabinds(data);
      }
    } catch (err) {
      console.error('Failed to fetch all syllabinds:', err);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && showAll) {
      fetchAllSyllabinds();
    }
  }, [isAdmin, showAll, fetchAllSyllabinds]);

  // Fetch learner counts for each syllabus
  useEffect(() => {
    const fetchCounts = async () => {
      const counts: Record<number, { total: number, active: number }> = {};

      for (const syllabus of mySyllabinds) {
        const { classmates, totalEnrolled } = await getLearnersForSyllabus(syllabus.id);
        const activeLearners = (classmates || []).filter(l => l.status === 'in-progress');
        counts[syllabus.id] = {
          total: totalEnrolled,
          active: activeLearners.length
        };
      }

      setLearnerCounts(counts);
    };

    if (mySyllabinds.length > 0) {
      fetchCounts();
    }
  }, [mySyllabinds.length]);

  // Reset selection when syllabinds change
  useEffect(() => {
    setSelectedIds([]);
  }, [displayedSyllabinds.length, showAll]);

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === displayedSyllabinds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedSyllabinds.map(s => s.id));
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      await batchDeleteSyllabinds(selectedIds);
      setSelectedIds([]);
      setShowDeleteDialog(false);
      // Refresh all syllabinds list if admin is viewing all
      if (isAdmin && showAll) {
        fetchAllSyllabinds();
      }
    } catch (err) {
      console.error('Failed to delete syllabinds:', err);
      alert('Failed to delete syllabinds. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatedPage className="space-y-4 sm:space-y-8 max-w-5xl mx-auto px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display mb-1">Syllabind Builder</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your syllabinds and track learner progress.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/creator/profile">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
          {subscriptionLimits?.canCreateMore !== false ? (
            <Link href="/creator/syllabind/new">
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

      {/* Admin toggle bar */}
      {isAdmin && (
        <div className="admin-toggle flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Shield className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">Admin View</span>
          <div className="flex items-center gap-1 ml-auto bg-amber-100 rounded-md p-0.5">
            <button
              onClick={() => setShowAll(false)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${!showAll ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-700 hover:text-amber-900'}`}
            >
              My Syllabinds
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${showAll ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-700 hover:text-amber-900'}`}
            >
              Others
            </button>
          </div>
        </div>
      )}

      {/* Selection toolbar */}
      {displayedSyllabinds.length > 0 && (
        <div className="selection-toolbar flex flex-wrap items-center justify-between gap-2 px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Checkbox
              id="select-all"
              checked={selectedIds.length === displayedSyllabinds.length && displayedSyllabinds.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-xs sm:text-sm text-muted-foreground cursor-pointer">
              {selectedIds.length === 0
                ? 'Select all'
                : selectedIds.length === displayedSyllabinds.length
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
      {displayedSyllabinds.length === 0 ? (
        <AnimatedCard delay={0.1}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-display">{showAll ? 'No syllabinds by other creators' : 'No syllabinds yet'}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {showAll
                    ? 'There are no syllabinds created by other users yet.'
                    : 'Create your first Syllabind to start sharing knowledge with learners. Use AI assistance to build a structured multi-week learning experience.'}
                </p>
              </div>
              {!showAll && (
                <Link href="/creator/syllabind/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Syllabind
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      ) : (
        <div className="grid gap-4">
          {displayedSyllabinds.map((syllabus, index) => {
          const isOtherCreator = showAll && syllabus.creatorId !== user?.username;
          return (
          <AnimatedCard key={syllabus.id} delay={0.05 * index}>
            <Card className={`hover:shadow-md transition-shadow ${selectedIds.includes(syllabus.id) ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                  <Checkbox
                    checked={selectedIds.includes(syllabus.id)}
                    onCheckedChange={() => handleToggleSelect(syllabus.id)}
                    className="mt-1 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {syllabus.status}
                      </Badge>
                      {isOtherCreator && (
                        <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                          by {syllabus.creator?.name || syllabus.creatorId}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-sm sm:text-lg leading-tight">{syllabus.title}</h3>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {pluralize(syllabus.durationWeeks, 'week')} • {syllabus.audienceLevel}
                      <span className="hidden sm:inline"> • Updated {syllabus.updatedAt ? formatDistanceToNow(new Date(syllabus.updatedAt), { addSuffix: true }) : 'recently'}</span>
                    </div>
                    {/* Mobile learner count */}
                    <div className="text-xs text-muted-foreground sm:hidden md:hidden">
                      {pluralize(learnerCounts[syllabus.id]?.total || 0, 'Learner')} • {pluralize(learnerCounts[syllabus.id]?.active || 0, 'Active')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto sm:ml-0">
                  <div className="mr-2 sm:mr-4 text-right hidden md:block">
                    <div className="text-sm font-medium">{pluralize(learnerCounts[syllabus.id]?.total || 0, 'Learner')}</div>
                    <div className="text-xs text-muted-foreground">{pluralize(learnerCounts[syllabus.id]?.active || 0, 'Active')}</div>
                  </div>
                  <Link href={`/creator/syllabind/${syllabus.id}/analytics`}>
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                      <BarChart2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Analytics</span>
                    </Button>
                  </Link>
                  <Link href={`/creator/syllabind/${syllabus.id}/edit`}>
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                      <Edit2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                  <Link href={`/syllabind/${syllabus.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                      <Eye className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Preview</span>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pluralize(selectedIds.length, 'syllabind', 'syllabinds')}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {pluralize(selectedIds.length, 'syllabind', 'syllabinds')} and all associated enrollments, submissions, and progress data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : `Delete ${pluralize(selectedIds.length, 'syllabind', 'syllabinds')}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        variant="creator-limit"
        returnTo="/creator"
      />
    </AnimatedPage>
  );
}
