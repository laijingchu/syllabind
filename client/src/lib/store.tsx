import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Syllabus, Enrollment, LearnerProfile, Submission, Cohort } from './types';
import { MOCK_USER, MOCK_SYLLABI, INITIAL_ENROLLMENT, MOCK_LEARNERS } from './mockData';
import { useLocation } from 'wouter';

interface StoreContextType {
  user: User | null;
  isAuthenticated: boolean;
  toggleCreatorMode: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  
  login: (email: string) => void;
  logout: () => void;
  signup: (name: string, email: string, isCreator: boolean) => void;

  syllabi: Syllabus[];
  enrollment: Enrollment;
  
  // Actions
  enrollInSyllabus: (syllabusId: string) => void;
  markStepComplete: (stepId: string) => void;
  markStepIncomplete: (stepId: string) => void;
  saveExercise: (stepId: string, answer: string, isShared: boolean) => void;
  
  // Creator Actions
  createSyllabus: (syllabus: Syllabus) => void;
  updateSyllabus: (syllabus: Syllabus) => void;
  completeActiveSyllabus: () => void; // Debug tool
  
  // Cohort & Feedback Actions
  cohorts: Cohort[];
  createCohort: (name: string, syllabusId: string) => void;
  assignLearnerToCohort: (cohortId: string, learnerId: string) => void;
  provideFeedback: (stepId: string, learnerId: string, feedback: Partial<Submission>) => void;
  getSubmissionsForStep: (stepId: string) => Record<string, Submission>; // learnerId -> Submission
  
  // Helpers
  getActiveSyllabus: () => Syllabus | undefined;
  getSyllabusById: (id: string) => Syllabus | undefined;
  isStepCompleted: (stepId: string) => boolean;
  getSubmission: (stepId: string) => Submission | undefined;
  getProgressForWeek: (syllabusId: string, weekIndex: number) => number; // 0-100
  getOverallProgress: (syllabusId: string) => number; // 0-100
  getLearnersForSyllabus: (syllabusId: string) => LearnerProfile[];
  getExerciseText: (stepId: string) => string | undefined;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();

  // App State
  const [syllabi, setSyllabi] = useState<Syllabus[]>(MOCK_SYLLABI);
  const [enrollment, setEnrollment] = useState<Enrollment>(INITIAL_ENROLLMENT);
  
  // Submissions: Map of stepId -> (Map of learnerId -> Submission)
  // For the current user (mock), we store it separately or integrate it?
  // Let's simplify: 
  // We need to store submissions for ALL learners to show them in the dashboard.
  // But since this is a mock, we only really have "state" for the current user.
  // The MOCK_LEARNERS don't really do anything.
  // To make the dashboard work, we need to generate mock submissions for MOCK_LEARNERS.
  
  const [userSubmissions, setUserSubmissions] = useState<Record<string, Submission>>({}); 
  
  // Mock cohorts
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  
  // Mock learner assignments (learnerId -> cohortId)
  const [learnerCohorts, setLearnerCohorts] = useState<Record<string, string>>({});

  const [learners] = useState<LearnerProfile[]>(MOCK_LEARNERS);

  const login = (email: string) => {
    // Mock login - just restore the mock user but with provided email
    const mockUser = { ...MOCK_USER, name: email.split('@')[0], isCreator: false }; 
    setUser(mockUser);
    setIsAuthenticated(true);
    setLocation('/');
  };

  const signup = (name: string, email: string, isCreator: boolean) => {
    const newUser: User = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      name,
      isCreator
    };
    setUser(newUser);
    setIsAuthenticated(true);
    setLocation('/');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setLocation('/welcome');
  };

  const toggleCreatorMode = () => {
    if (user) {
      setUser(prev => prev ? ({ ...prev, isCreator: !prev.isCreator }) : null);
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prev => prev ? ({ ...prev, ...updatedUser }) : null);
  };

  const enrollInSyllabus = (syllabusId: string) => {
    setEnrollment(prev => ({
      ...prev,
      activeSyllabusId: syllabusId,
      currentWeekIndex: 1, 
    }));
  };

  const markStepComplete = (stepId: string) => {
    setEnrollment(prev => ({
      ...prev,
      completedStepIds: [...prev.completedStepIds, stepId],
    }));
  };

  const markStepIncomplete = (stepId: string) => {
    setEnrollment(prev => ({
      ...prev,
      completedStepIds: prev.completedStepIds.filter(id => id !== stepId),
    }));
  };

  const saveExercise = (stepId: string, answer: string, isShared: boolean) => {
    setUserSubmissions(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId], // Preserve existing feedback if any
        stepId,
        answer,
        submittedAt: new Date().toISOString(),
        isShared,
      }
    }));
    markStepComplete(stepId);
  };

  const createSyllabus = (newSyllabus: Syllabus) => {
    setSyllabi(prev => [...prev, newSyllabus]);
  };

  const updateSyllabus = (updatedSyllabus: Syllabus) => {
    setSyllabi(prev => prev.map(s => s.id === updatedSyllabus.id ? updatedSyllabus : s));
  };

  const createCohort = (name: string, syllabusId: string) => {
    const newCohort: Cohort = {
      id: `cohort-${Math.random().toString(36).substr(2, 9)}`,
      name,
      syllabusId,
      learnerIds: []
    };
    setCohorts(prev => [...prev, newCohort]);
  };

  const assignLearnerToCohort = (cohortId: string, learnerId: string) => {
    setCohorts(prev => prev.map(c => {
      if (c.id === cohortId) {
        // If learner is already in another cohort for this syllabus, remove them?
        // For simplicity, we just add them here.
        return { ...c, learnerIds: [...c.learnerIds, learnerId] };
      }
      return c;
    }));
    setLearnerCohorts(prev => ({ ...prev, [learnerId]: cohortId }));
  };
  
  // This is a bit tricky with mock data. 
  // We need to store feedback for MOCK learners too.
  // Let's create a separate state for "all submissions" including mock ones.
  // Initialize with some mock submissions for the mock learners.
  const [allSubmissions, setAllSubmissions] = useState<Record<string, Record<string, Submission>>>({
     // stepId -> { learnerId -> Submission }
  });

  const provideFeedback = (stepId: string, learnerId: string, feedback: Partial<Submission>) => {
     // If it's the current user
     if (user && learnerId === user.id) {
       setUserSubmissions(prev => ({
         ...prev,
         [stepId]: { ...prev[stepId], ...feedback }
       }));
     } else {
       // Mock learner
       setAllSubmissions(prev => ({
         ...prev,
         [stepId]: {
           ...prev[stepId],
           [learnerId]: {
             ...prev[stepId]?.[learnerId],
             ...feedback
           } as Submission
         }
       }));
     }
  };

  const getSubmissionsForStep = (stepId: string) => {
    // Combine mock submissions and user submission
    const result = { ...allSubmissions[stepId] };
    if (user && userSubmissions[stepId] && userSubmissions[stepId].isShared) {
      result[user.id] = userSubmissions[stepId];
    }
    return result;
  };

  const completeActiveSyllabus = () => {
    if (!enrollment.activeSyllabusId) return;
    const syllabus = syllabi.find(s => s.id === enrollment.activeSyllabusId);
    if (!syllabus) return;

    const allStepIds = syllabus.weeks.flatMap(w => w.steps.map(s => s.id));
    setEnrollment(prev => ({
      ...prev,
      currentWeekIndex: syllabus.durationWeeks,
      completedStepIds: Array.from(new Set([...prev.completedStepIds, ...allStepIds])),
      completedSyllabusIds: Array.from(new Set([...prev.completedSyllabusIds, syllabus.id]))
    }));
  };

  const getActiveSyllabus = () => syllabi.find(s => s.id === enrollment.activeSyllabusId);
  const getSyllabusById = (id: string) => syllabi.find(s => s.id === id);
  const isStepCompleted = (stepId: string) => enrollment.completedStepIds.includes(stepId);
  const getSubmission = (stepId: string) => userSubmissions[stepId];
  const getExerciseText = (stepId: string) => userSubmissions[stepId]?.answer; // Backwards compat shim

  const getProgressForWeek = (syllabusId: string, weekIndex: number) => {
    const syllabus = syllabi.find(s => s.id === syllabusId);
    if (!syllabus) return 0;
    const week = syllabus.weeks.find(w => w.index === weekIndex);
    if (!week || week.steps.length === 0) return 0;

    const completedInWeek = week.steps.filter(step => enrollment.completedStepIds.includes(step.id)).length;
    return Math.round((completedInWeek / week.steps.length) * 100);
  };
  
  const getOverallProgress = (syllabusId: string) => {
     const syllabus = syllabi.find(s => s.id === syllabusId);
     if (!syllabus) return 0;
     
     const activeWeeks = syllabus.weeks.filter(w => w.steps.length > 0);
     const totalSteps = activeWeeks.flatMap(w => w.steps);
     if (totalSteps.length === 0) return 0;
     
     const completedCount = totalSteps.filter(s => enrollment.completedStepIds.includes(s.id)).length;
     return Math.round((completedCount / totalSteps.length) * 100);
  };

  const getLearnersForSyllabus = (syllabusId: string) => {
    // In a real app, this would filter by syllabus ID. 
    // For mock, we just return the mock learners plus the current user if enrolled
    const activeLearners = learners.map(l => ({
      ...l,
      cohortId: learnerCohorts[l.user.id]
    }));
    
    // Add current user if enrolled and opted in
    if (user && user.shareProfile && enrollment.activeSyllabusId === syllabusId) {
       // Check if not already in list
       if (!activeLearners.some(l => l.user.id === user.id)) {
         activeLearners.push({
           user: user,
           status: getOverallProgress(syllabusId) === 100 ? 'completed' : 'in-progress',
           joinedDate: new Date().toISOString(),
           cohortId: learnerCohorts[user.id]
         });
       }
    }
    return activeLearners;
  };

  // Initial populate of mock submissions for testing
  useEffect(() => {
    if (Object.keys(allSubmissions).length === 0 && syllabi.length > 0) {
      // Find an exercise step
      const step = syllabi[0].weeks[0].steps.find(s => s.type === 'exercise');
      if (step) {
         setAllSubmissions({
           [step.id]: {
             [MOCK_LEARNERS[0].user.id]: {
               stepId: step.id,
               answer: "https://codepen.io/example",
               submittedAt: new Date().toISOString(),
               isShared: true
             },
             [MOCK_LEARNERS[1].user.id]: {
                stepId: step.id,
                answer: "https://github.com/example",
                submittedAt: new Date().toISOString(),
                isShared: true
             }
           }
         });
      }
    }
  }, [syllabi]);

  // Check for completion whenever steps change
  useEffect(() => {
    if (!enrollment.activeSyllabusId) return;
    
    const syllabus = syllabi.find(s => s.id === enrollment.activeSyllabusId);
    if (!syllabus) return;

    const activeWeeks = syllabus.weeks.filter(w => w.steps.length > 0);
    const allStepIds = activeWeeks.flatMap(w => w.steps.map(s => s.id));
    const allCompleted = allStepIds.every(id => enrollment.completedStepIds.includes(id));

    let updates: Partial<Enrollment> = {};

    if (allCompleted && !enrollment.completedSyllabusIds.includes(syllabus.id)) {
      updates.completedSyllabusIds = [...enrollment.completedSyllabusIds, syllabus.id];
    }

    // Check current week completion to advance index
    const currentWeek = syllabus.weeks.find(w => w.index === enrollment.currentWeekIndex);
    if (currentWeek && currentWeek.steps.length > 0) {
        const isWeekDone = currentWeek.steps.every(s => enrollment.completedStepIds.includes(s.id));
        // Only advance if we are not at the end
        if (isWeekDone && enrollment.currentWeekIndex < syllabus.durationWeeks) {
            updates.currentWeekIndex = enrollment.currentWeekIndex + 1;
        }
    }

    if (Object.keys(updates).length > 0) {
      setEnrollment(prev => ({
        ...prev,
        ...updates
      }));
    }
  }, [enrollment.completedStepIds, enrollment.activeSyllabusId, syllabi, enrollment.currentWeekIndex, enrollment.completedSyllabusIds]);

  return (
    <StoreContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        signup,
        toggleCreatorMode,
        updateUser,
        syllabi,
        enrollment,
        enrollInSyllabus,
        markStepComplete,
        markStepIncomplete,
        saveExercise,
        createSyllabus,
        updateSyllabus,
        completeActiveSyllabus,
        cohorts,
        createCohort,
        assignLearnerToCohort,
        provideFeedback,
        getSubmissionsForStep,
        getActiveSyllabus,
        getSyllabusById,
        isStepCompleted,
        getProgressForWeek,
        getOverallProgress,
        getExerciseText,
        getLearnersForSyllabus,
        getSubmission,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
