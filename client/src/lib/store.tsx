import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Syllabus, Enrollment, LearnerProfile } from './types';
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
  saveExercise: (stepId: string, answer: string) => void; // Mock save
  
  // Creator Actions
  createSyllabus: (syllabus: Syllabus) => void;
  updateSyllabus: (syllabus: Syllabus) => void;
  completeActiveSyllabus: () => void; // Debug tool
  
  // Helpers
  getActiveSyllabus: () => Syllabus | undefined;
  getSyllabusById: (id: string) => Syllabus | undefined;
  isStepCompleted: (stepId: string) => boolean;
  getExerciseText: (stepId: string) => string | undefined;
  getProgressForWeek: (syllabusId: string, weekIndex: number) => number; // 0-100
  getOverallProgress: (syllabusId: string) => number; // 0-100
  getLearnersForSyllabus: (syllabusId: string) => LearnerProfile[];
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
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({}); 
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

  const saveExercise = (stepId: string, answer: string) => {
    setExerciseAnswers(prev => ({ ...prev, [stepId]: answer }));
    markStepComplete(stepId);
  };

  const createSyllabus = (newSyllabus: Syllabus) => {
    setSyllabi(prev => [...prev, newSyllabus]);
  };

  const updateSyllabus = (updatedSyllabus: Syllabus) => {
    setSyllabi(prev => prev.map(s => s.id === updatedSyllabus.id ? updatedSyllabus : s));
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
  const getExerciseText = (stepId: string) => exerciseAnswers[stepId];

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
    const activeLearners = [...learners];
    
    // Add current user if enrolled and opted in
    if (user && user.shareProfile && enrollment.activeSyllabusId === syllabusId) {
       // Check if not already in list
       if (!activeLearners.some(l => l.user.id === user.id)) {
         activeLearners.push({
           user: user,
           status: getOverallProgress(syllabusId) === 100 ? 'completed' : 'in-progress',
           joinedDate: new Date().toISOString()
         });
       }
    }
    return activeLearners;
  };

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
        getActiveSyllabus,
        getSyllabusById,
        isStepCompleted,
        getProgressForWeek,
        getOverallProgress,
        getExerciseText,
        getLearnersForSyllabus,
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
