import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePostHog } from '@posthog/react';
import { useAuth } from '@/hooks/use-auth';
import { Binder, Enrollment, ReaderProfile, Submission, SubscriptionLimits } from './types';

interface StoreContextType {
  user: any;
  isAuthenticated: boolean;
  logout: () => void;
  isLoading: boolean;

  // Data
  binders: Binder[];
  enrollment: Enrollment | null;
  completedStepIds: number[];

  // Loading states
  bindersLoading: boolean;
  enrollmentLoading: boolean;

  // Actions
  toggleCuratorMode: () => Promise<void>;
  completeActiveBinder: () => Promise<void>;
  updateEnrollment: (updates: Partial<Enrollment>) => void;
  completeStep: (stepId: number) => Promise<void>;
  markStepComplete: (stepId: number, enrollmentId?: number) => Promise<void>;
  markStepIncomplete: (stepId: number, enrollmentId?: number) => Promise<void>;
  saveExercise: (stepId: number, answer: string, isShared: boolean, enrollmentId?: number) => Promise<void>;
  getSubmission: (stepId: number) => Submission | undefined;
  getActiveBinder: () => Binder | undefined;
  getBinderById: (id: number) => Binder | undefined;
  getOverallProgress: (binderId: number) => number;
  enrollInBinder: (binderId: number, shareProfile?: boolean) => Promise<void>;
  isStepCompleted: (stepId: number) => boolean;
  getExerciseText: (stepId: number) => string | null;
  getReadersForBinder: (binderId: number) => Promise<{ classmates: ReaderProfile[]; totalEnrolled: number }>;
  updateEnrollmentShareProfile: (enrollmentId: number, shareProfile: boolean) => Promise<void>;
  updateUser: (updates: any) => Promise<void>;
  getProgressForWeek: (binderId: number, weekIndex: number) => number;
  createBinder: (binder: any) => Promise<Binder>;
  updateBinder: (binder: Binder) => Promise<void>;
  batchDeleteBinders: (ids: number[]) => Promise<void>;
  getSubmissionsForStep: (stepId: number) => Record<string, Submission>;
  refreshBinders: () => Promise<void>;
  refreshEnrollments: () => Promise<void>;

  // Subscription
  isPro: boolean;
  subscriptionLimits: SubscriptionLimits | null;
  refreshSubscriptionLimits: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const [binders, setBinders] = useState<Binder[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<number[]>([]);
  const [bindersLoading, setBindersLoading] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [subscriptionLimits, setSubscriptionLimits] = useState<SubscriptionLimits | null>(null);

  const isPro = user?.subscriptionStatus === 'pro' || user?.isAdmin === true;

  // Fetch binders on mount
  useEffect(() => {
    refreshBinders();
  }, []);

  // Identify user in PostHog on login, reset on logout
  useEffect(() => {
    if (isAuthenticated && user && posthog) {
      posthog.identify(user.username, {
        email: user.email,
        name: user.name,
        is_curator: user.isCurator,
      });
    } else if (!isAuthenticated && posthog) {
      posthog.reset();
    }
  }, [isAuthenticated, user, posthog]);

  // Fetch enrollments when user logs in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      refreshEnrollments();
    } else if (!isAuthenticated) {
      setEnrollment(null);
      setCompletedStepIds([]);
      setSubmissions([]);
    }
  }, [isAuthenticated, isLoading]);

  // Fetch completed steps and submissions when enrollment changes
  useEffect(() => {
    if (enrollment?.id) {
      // Fetch completed steps
      fetch(`/api/enrollments/${enrollment.id}/completed-steps`, {
        credentials: 'include'
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setCompletedStepIds(data))
        .catch(err => console.error('Failed to fetch completed steps:', err));

      // Fetch submissions
      fetch(`/api/enrollments/${enrollment.id}/submissions`, {
        credentials: 'include'
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setSubmissions(data))
        .catch(err => console.error('Failed to fetch submissions:', err));
    }
  }, [enrollment?.id]);

  const refreshBinders = async () => {
    setBindersLoading(true);
    try {
      const res = await fetch('/api/binders');
      if (res.ok) {
        const data = await res.json();
        setBinders(data);
      }
    } catch (err) {
      console.error('Failed to fetch binders:', err);
    } finally {
      setBindersLoading(false);
    }
  };

  const refreshEnrollments = async () => {
    setEnrollmentLoading(true);
    try {
      const res = await fetch('/api/enrollments', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        // Extract completed binder IDs from all completed enrollments
        const completedBinderIds = data
          .filter((e: any) => e.status === 'completed')
          .map((e: any) => e.binderId);

        // Use only in-progress enrollment as active (don't fall back to completed)
        const activeEnrollment = data.find((e: any) => e.status === 'in-progress') || null;
        // Transform backend enrollment to match frontend Enrollment type
        setEnrollment({
          id: activeEnrollment?.id,
          activeBinderId: activeEnrollment?.binderId || null,
          currentWeekIndex: activeEnrollment?.currentWeekIndex || 1,
          completedStepIds: [], // Will be loaded separately
          completedBinderIds
        });
      }
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const refreshSubscriptionLimits = async () => {
    try {
      const res = await fetch('/api/subscription/limits', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionLimits(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription limits:', err);
    }
  };

  // Fetch subscription limits when user logs in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      refreshSubscriptionLimits();
    } else if (!isAuthenticated) {
      setSubscriptionLimits(null);
    }
  }, [isAuthenticated, isLoading]);

  const toggleCuratorMode = async () => {
    try {
      const res = await fetch('/api/users/me/toggle-curator', {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to toggle curator mode');

      // Reload the page to refresh auth state
      window.location.reload();
    } catch (err) {
      console.error('Failed to toggle curator mode:', err);
      throw err;
    }
  };

  const enrollInBinder = async (binderId: number, shareProfile?: boolean) => {
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ binderId, shareProfile: shareProfile === true })
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error('Already enrolled in this binder');
        }
        throw new Error('Failed to enroll');
      }

      const newEnrollment = await res.json();
      setEnrollment(prev => ({
        id: newEnrollment.id,
        activeBinderId: newEnrollment.binderId,
        currentWeekIndex: newEnrollment.currentWeekIndex || 1,
        completedStepIds: [],
        completedBinderIds: prev?.completedBinderIds || []
      }));
      posthog?.capture('enrolled_in_binder', { binder_id: binderId });
    } catch (err) {
      console.error('Failed to enroll:', err);
      throw err;
    }
  };

  const markStepComplete = async (stepId: number, enrollmentId?: number) => {
    const effectiveId = enrollmentId || enrollment?.id;
    if (!effectiveId) return;

    try {
      const res = await fetch(`/api/enrollments/${effectiveId}/steps/${stepId}/complete`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to mark step complete');

      // Update local state optimistically
      setCompletedStepIds(prev => {
        if (prev.includes(stepId)) return prev;
        return [...prev, stepId];
      });
      posthog?.capture('step_completed', { step_id: stepId, binder_id: enrollment?.activeBinderId });
    } catch (err) {
      console.error('Failed to mark step complete:', err);
      throw err;
    }
  };

  const markStepIncomplete = async (stepId: number, enrollmentId?: number) => {
    const effectiveId = enrollmentId || enrollment?.id;
    if (!effectiveId) return;

    try {
      const res = await fetch(`/api/enrollments/${effectiveId}/steps/${stepId}/complete`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to mark step incomplete');

      // Update local state
      setCompletedStepIds(prev => prev.filter(id => id !== stepId));
    } catch (err) {
      console.error('Failed to mark step incomplete:', err);
      throw err;
    }
  };

  const completeStep = markStepComplete;

  const completeActiveBinder = async () => {
    if (!enrollment?.id) return;

    try {
      const res = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' })
      });

      if (!res.ok) throw new Error('Failed to complete binder');

      // Add to completed list and clear active enrollment
      posthog?.capture('binder_completed', { binder_id: enrollment.activeBinderId });
      const completedId = enrollment.activeBinderId;
      setEnrollment(prev => prev ? {
        ...prev,
        activeBinderId: null,
        completedBinderIds: completedId
          ? [...(prev.completedBinderIds || []), completedId]
          : prev.completedBinderIds || []
      } : null);
    } catch (err) {
      console.error('Failed to complete binder:', err);
      throw err;
    }
  };

  const saveExercise = async (stepId: number, answer: string, isShared: boolean, enrollmentId?: number) => {
    const effectiveId = enrollmentId || enrollment?.id;
    if (!effectiveId) {
      console.error('No enrollment ID - cannot save submission');
      return;
    }

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enrollmentId: effectiveId,
          stepId,
          answer,
          isShared,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save submission');
      }

      const submission = await response.json();
      posthog?.capture('exercise_submitted', { step_id: stepId, binder_id: enrollment?.activeBinderId });

      // Update local state
      setSubmissions(prev => {
        const existing = prev.findIndex(s => s.stepId === stepId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = submission;
          return updated;
        }
        return [...prev, submission];
      });

      // Mark the step as complete
      await markStepComplete(stepId, effectiveId);
    } catch (error) {
      console.error('Failed to save exercise submission:', error);
      throw error;
    }
  };

  const updateUser = async (updates: any) => {
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Failed to update user');

      const updatedUser = await res.json();
      queryClient.setQueryData(["/api/auth/me"], updatedUser);
      // Refresh binders so curator profile data on cards stays current
      refreshBinders();
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  };

  const createBinder = async (binderData: any): Promise<Binder> => {
    try {
      const res = await fetch('/api/binders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(binderData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create binder');
      }

      const binder = await res.json();

      // Refresh binders list
      await refreshBinders();

      return binder;
    } catch (err) {
      console.error('Failed to create binder:', err);
      throw err;
    }
  };

  const updateBinder = async (binder: Binder) => {
    try {
      const res = await fetch(`/api/binders/${binder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(binder)
      });

      if (!res.ok) throw new Error('Failed to update binder');

      // Refresh binders list
      await refreshBinders();
    } catch (err) {
      console.error('Failed to update binder:', err);
      throw err;
    }
  };

  const batchDeleteBinders = async (ids: number[]) => {
    try {
      const res = await fetch('/api/binders/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete binders');
      }

      // Refresh binders list
      await refreshBinders();
    } catch (err) {
      console.error('Failed to delete binders:', err);
      throw err;
    }
  };

  const getReadersForBinder = async (binderId: number): Promise<{ classmates: ReaderProfile[]; totalEnrolled: number }> => {
    try {
      const res = await fetch(`/api/binders/${binderId}/classmates`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch readers');

      const data = await res.json();
      // Handle both old format (array) and new format (object with classmates/totalEnrolled)
      if (Array.isArray(data)) {
        return { classmates: data, totalEnrolled: data.length };
      }
      return {
        classmates: Array.isArray(data.classmates) ? data.classmates : [],
        totalEnrolled: typeof data.totalEnrolled === 'number' ? data.totalEnrolled : 0
      };
    } catch (err) {
      console.error('Failed to fetch readers:', err);
      return { classmates: [], totalEnrolled: 0 };
    }
  };

  const updateEnrollmentShareProfile = async (enrollmentId: number, shareProfile: boolean) => {
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/share-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shareProfile })
      });
      if (!res.ok) throw new Error('Failed to update share profile');
    } catch (err) {
      console.error('Failed to update enrollment share profile:', err);
      throw err;
    }
  };

  const updateEnrollment = (updates: Partial<Enrollment>) => {
    setEnrollment(prev => prev ? { ...prev, ...updates } : null);
  };

  const getSubmission = (stepId: number) => {
    return submissions.find(s => s.stepId === stepId);
  };

  const getActiveBinder = () => {
    if (!enrollment?.activeBinderId) return undefined;
    return binders.find(s => s.id === enrollment.activeBinderId);
  };

  const getBinderById = (id: number) => {
    return binders.find(s => s.id === id);
  };

  const isStepCompleted = (stepId: number) => {
    return completedStepIds.includes(stepId);
  };

  const getExerciseText = (stepId: number) => {
    const submission = getSubmission(stepId);
    return submission?.answer || null;
  };

  const getOverallProgress = (binderId: number) => {
    const binder = getBinderById(binderId);
    if (!binder || !binder.weeks) return 0;

    const allStepIds = binder.weeks.flatMap(week => week.steps.map(step => step.id));
    if (allStepIds.length === 0) return 0;

    const completedCount = allStepIds.filter(id => completedStepIds.includes(id)).length;
    return Math.round((completedCount / allStepIds.length) * 100);
  };

  const getProgressForWeek = (binderId: number, weekIndex: number) => {
    const binder = getBinderById(binderId);
    if (!binder || !binder.weeks) return 0;

    const week = binder.weeks.find(w => w.index === weekIndex);
    if (!week || week.steps.length === 0) return 0;

    const weekStepIds = week.steps.map(step => step.id);
    const completedCount = weekStepIds.filter(id => completedStepIds.includes(id)).length;
    return Math.round((completedCount / weekStepIds.length) * 100);
  };

  const getSubmissionsForStep = (stepId: number) => {
    const stepSubmissions = submissions.filter(s => s.stepId === stepId);
    const result: Record<string, Submission> = {};
    stepSubmissions.forEach((sub, index) => {
      result[`reader-${index}`] = sub;
    });
    return result;
  };

  return (
    <StoreContext.Provider value={{
      user,
      isAuthenticated,
      logout,
      isLoading,
      binders,
      enrollment,
      completedStepIds,
      bindersLoading,
      enrollmentLoading,
      toggleCuratorMode,
      completeActiveBinder,
      updateEnrollment,
      completeStep,
      markStepComplete,
      markStepIncomplete,
      saveExercise,
      getSubmission,
      getActiveBinder,
      getBinderById,
      getOverallProgress,
      enrollInBinder,
      isStepCompleted,
      getExerciseText,
      getReadersForBinder,
      updateEnrollmentShareProfile,
      updateUser,
      getProgressForWeek,
      createBinder,
      updateBinder,
      batchDeleteBinders,
      getSubmissionsForStep,
      refreshBinders,
      refreshEnrollments,
      isPro,
      subscriptionLimits,
      refreshSubscriptionLimits,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
