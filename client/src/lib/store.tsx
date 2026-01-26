import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Syllabus, Enrollment, LearnerProfile, Submission } from './types';

interface StoreContextType {
  user: any;
  isAuthenticated: boolean;
  logout: () => void;
  isLoading: boolean;

  // Data
  syllabi: Syllabus[];
  enrollment: Enrollment | null;
  completedStepIds: number[];

  // Loading states
  syllabiLoading: boolean;
  enrollmentLoading: boolean;

  // Actions
  toggleCreatorMode: () => Promise<void>;
  completeActiveSyllabus: () => Promise<void>;
  updateEnrollment: (updates: Partial<Enrollment>) => void;
  completeStep: (stepId: number) => Promise<void>;
  markStepComplete: (stepId: number) => Promise<void>;
  markStepIncomplete: (stepId: number) => Promise<void>;
  saveExercise: (stepId: number, answer: string, isShared: boolean) => Promise<void>;
  getSubmission: (stepId: number) => Submission | undefined;
  getActiveSyllabus: () => Syllabus | undefined;
  getSyllabusById: (id: number) => Syllabus | undefined;
  getOverallProgress: (syllabusId: number) => number;
  enrollInSyllabus: (syllabusId: number) => Promise<void>;
  isStepCompleted: (stepId: number) => boolean;
  getExerciseText: (stepId: number) => string | null;
  getLearnersForSyllabus: (syllabusId: number) => Promise<LearnerProfile[]>;
  updateUser: (updates: any) => Promise<void>;
  getProgressForWeek: (syllabusId: number, weekIndex: number) => number;
  createSyllabus: (syllabus: any) => Promise<Syllabus>;
  updateSyllabus: (syllabus: Syllabus) => Promise<void>;
  getSubmissionsForStep: (stepId: number) => Record<string, Submission>;
  refreshSyllabi: () => Promise<void>;
  refreshEnrollments: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<number[]>([]);
  const [syllabiLoading, setSyllabiLoading] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  // Fetch syllabi on mount
  useEffect(() => {
    refreshSyllabi();
  }, []);

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

  const refreshSyllabi = async () => {
    setSyllabiLoading(true);
    try {
      const res = await fetch('/api/syllabi');
      if (res.ok) {
        const data = await res.json();
        setSyllabi(data);
      }
    } catch (err) {
      console.error('Failed to fetch syllabi:', err);
    } finally {
      setSyllabiLoading(false);
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
        // Use the first in-progress enrollment as active
        const activeEnrollment = data.find((e: any) => e.status === 'in-progress') || data[0] || null;
        if (activeEnrollment) {
          // Transform backend enrollment to match frontend Enrollment type
          setEnrollment({
            id: activeEnrollment.id,
            activeSyllabusId: activeEnrollment.syllabusId,
            currentWeekIndex: activeEnrollment.currentWeekIndex || 1,
            completedStepIds: [], // Will be loaded separately
            completedSyllabusIds: [] // TODO: track completed syllabi
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const toggleCreatorMode = async () => {
    try {
      const res = await fetch('/api/users/me/toggle-creator', {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to toggle creator mode');

      // Reload the page to refresh auth state
      window.location.reload();
    } catch (err) {
      console.error('Failed to toggle creator mode:', err);
      throw err;
    }
  };

  const enrollInSyllabus = async (syllabusId: number) => {
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ syllabusId })
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error('Already enrolled in this syllabus');
        }
        throw new Error('Failed to enroll');
      }

      const newEnrollment = await res.json();
      setEnrollment({
        id: newEnrollment.id,
        activeSyllabusId: newEnrollment.syllabusId,
        currentWeekIndex: newEnrollment.currentWeekIndex || 1,
        completedStepIds: [],
        completedSyllabusIds: []
      });
    } catch (err) {
      console.error('Failed to enroll:', err);
      throw err;
    }
  };

  const markStepComplete = async (stepId: number) => {
    if (!enrollment?.id) return;

    try {
      const res = await fetch(`/api/enrollments/${enrollment.id}/steps/${stepId}/complete`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to mark step complete');

      // Update local state optimistically
      setCompletedStepIds(prev => {
        if (prev.includes(stepId)) return prev;
        return [...prev, stepId];
      });
    } catch (err) {
      console.error('Failed to mark step complete:', err);
      throw err;
    }
  };

  const markStepIncomplete = async (stepId: number) => {
    if (!enrollment?.id) return;

    try {
      const res = await fetch(`/api/enrollments/${enrollment.id}/steps/${stepId}/complete`, {
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

  const completeActiveSyllabus = async () => {
    if (!enrollment?.id) return;

    try {
      const res = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' })
      });

      if (!res.ok) throw new Error('Failed to complete syllabus');

      const updated = await res.json();
      setEnrollment(prev => prev ? { ...prev, ...updated } : null);
    } catch (err) {
      console.error('Failed to complete syllabus:', err);
      throw err;
    }
  };

  const saveExercise = async (stepId: number, answer: string, isShared: boolean) => {
    if (!enrollment?.id) {
      console.error('No enrollment ID - cannot save submission');
      return;
    }

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          stepId,
          answer,
          isShared,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save submission');
      }

      const submission = await response.json();

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
      await markStepComplete(stepId);
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

      // Reload to refresh user state
      window.location.reload();
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  };

  const createSyllabus = async (syllabusData: any): Promise<Syllabus> => {
    try {
      const res = await fetch('/api/syllabi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(syllabusData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create syllabus');
      }

      const syllabus = await res.json();

      // Refresh syllabi list
      await refreshSyllabi();

      return syllabus;
    } catch (err) {
      console.error('Failed to create syllabus:', err);
      throw err;
    }
  };

  const updateSyllabus = async (syllabus: Syllabus) => {
    try {
      const res = await fetch(`/api/syllabi/${syllabus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(syllabus)
      });

      if (!res.ok) throw new Error('Failed to update syllabus');

      // Refresh syllabi list
      await refreshSyllabi();
    } catch (err) {
      console.error('Failed to update syllabus:', err);
      throw err;
    }
  };

  const getLearnersForSyllabus = async (syllabusId: number): Promise<LearnerProfile[]> => {
    try {
      const res = await fetch(`/api/syllabi/${syllabusId}/learners`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch learners');

      return await res.json();
    } catch (err) {
      console.error('Failed to fetch learners:', err);
      return [];
    }
  };

  const updateEnrollment = (updates: Partial<Enrollment>) => {
    setEnrollment(prev => prev ? { ...prev, ...updates } : null);
  };

  const getSubmission = (stepId: number) => {
    return submissions.find(s => s.stepId === stepId);
  };

  const getActiveSyllabus = () => {
    if (!enrollment?.activeSyllabusId) return undefined;
    return syllabi.find(s => s.id === enrollment.activeSyllabusId);
  };

  const getSyllabusById = (id: number) => {
    return syllabi.find(s => s.id === id);
  };

  const isStepCompleted = (stepId: number) => {
    return completedStepIds.includes(stepId);
  };

  const getExerciseText = (stepId: number) => {
    const submission = getSubmission(stepId);
    return submission?.answer || null;
  };

  const getOverallProgress = (syllabusId: number) => {
    const syllabus = getSyllabusById(syllabusId);
    if (!syllabus || !syllabus.weeks) return 0;

    const allStepIds = syllabus.weeks.flatMap(week => week.steps.map(step => step.id));
    if (allStepIds.length === 0) return 0;

    const completedCount = allStepIds.filter(id => completedStepIds.includes(id)).length;
    return Math.round((completedCount / allStepIds.length) * 100);
  };

  const getProgressForWeek = (syllabusId: number, weekIndex: number) => {
    const syllabus = getSyllabusById(syllabusId);
    if (!syllabus || !syllabus.weeks) return 0;

    const week = syllabus.weeks.find(w => w.index === weekIndex);
    if (!week || week.steps.length === 0) return 0;

    const weekStepIds = week.steps.map(step => step.id);
    const completedCount = weekStepIds.filter(id => completedStepIds.includes(id)).length;
    return Math.round((completedCount / weekStepIds.length) * 100);
  };

  const getSubmissionsForStep = (stepId: number) => {
    const stepSubmissions = submissions.filter(s => s.stepId === stepId);
    const result: Record<string, Submission> = {};
    stepSubmissions.forEach((sub, index) => {
      result[`learner-${index}`] = sub;
    });
    return result;
  };

  return (
    <StoreContext.Provider value={{
      user,
      isAuthenticated,
      logout,
      isLoading,
      syllabi,
      enrollment,
      completedStepIds,
      syllabiLoading,
      enrollmentLoading,
      toggleCreatorMode,
      completeActiveSyllabus,
      updateEnrollment,
      completeStep,
      markStepComplete,
      markStepIncomplete,
      saveExercise,
      getSubmission,
      getActiveSyllabus,
      getSyllabusById,
      getOverallProgress,
      enrollInSyllabus,
      isStepCompleted,
      getExerciseText,
      getLearnersForSyllabus,
      updateUser,
      getProgressForWeek,
      createSyllabus,
      updateSyllabus,
      getSubmissionsForStep,
      refreshSyllabi,
      refreshEnrollments
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
