import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Syllabus, Enrollment } from './types';
import { MOCK_USER, MOCK_SYLLABI, INITIAL_ENROLLMENT } from './mockData';
import { useLocation } from 'wouter';

interface StoreContextType {
  user: User | null;
  isAuthenticated: boolean;
  toggleCreatorMode: () => void;
  
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
  getProgressForWeek: (syllabusId: string, weekIndex: number) => number; // 0-100
  getOverallProgress: (syllabusId: string) => number; // 0-100
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

  // Check for completion whenever steps change
  useEffect(() => {
    if (!enrollment.activeSyllabusId) return;
    
    const syllabus = syllabi.find(s => s.id === enrollment.activeSyllabusId);
    if (!syllabus) return;

    const activeWeeks = syllabus.weeks.filter(w => w.steps.length > 0);
    const allStepIds = activeWeeks.flatMap(w => w.steps.map(s => s.id));
    const allCompleted = allStepIds.every(id => enrollment.completedStepIds.includes(id));

    if (allCompleted && !enrollment.completedSyllabusIds.includes(syllabus.id)) {
      setEnrollment(prev => ({
        ...prev,
        completedSyllabusIds: [...prev.completedSyllabusIds, syllabus.id]
      }));
    }
  }, [enrollment.completedStepIds, enrollment.activeSyllabusId, syllabi]);

  return (
    <StoreContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        signup,
        toggleCreatorMode,
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
