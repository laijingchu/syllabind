import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Syllabus, Enrollment } from './types';
import { MOCK_USER, MOCK_SYLLABI, INITIAL_ENROLLMENT } from './mockData';

interface StoreContextType {
  user: User;
  toggleCreatorMode: () => void;
  
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
  
  // Helpers
  getActiveSyllabus: () => Syllabus | undefined;
  getSyllabusById: (id: string) => Syllabus | undefined;
  isStepCompleted: (stepId: string) => boolean;
  getProgressForWeek: (syllabusId: string, weekIndex: number) => number; // 0-100
  getOverallProgress: (syllabusId: string) => number; // 0-100
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(MOCK_USER);
  const [syllabi, setSyllabi] = useState<Syllabus[]>(MOCK_SYLLABI);
  const [enrollment, setEnrollment] = useState<Enrollment>(INITIAL_ENROLLMENT);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({}); // stepId -> answer

  const toggleCreatorMode = () => {
    setUser(prev => ({ ...prev, isCreator: !prev.isCreator }));
  };

  const enrollInSyllabus = (syllabusId: string) => {
    // Logic: If already enrolled in another, switch. Reset progress for new one?
    // PRD: "Switch to this one? ... resets progress for the new one" 
    // Ideally we might want to keep progress of old ones, but PRD says "Active Syllabus" singular.
    // Let's keep `completedStepIds` global but `activeSyllabusId` switches.
    // That way if they come back, progress is remembered (better UX).
    setEnrollment(prev => ({
      ...prev,
      activeSyllabusId: syllabusId,
      currentWeekIndex: 1, // Start at week 1 of new syllabus
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
     
     const totalSteps = syllabus.weeks.flatMap(w => w.steps);
     if (totalSteps.length === 0) return 0;
     
     const completedCount = totalSteps.filter(s => enrollment.completedStepIds.includes(s.id)).length;
     return Math.round((completedCount / totalSteps.length) * 100);
  };

  // Check for week unlocking logic could be here, or in the view component.
  // PRD: "decide currentWeekIndex based on completedStepIds"
  // Let's perform a check whenever completedStepIds changes to update currentWeekIndex?
  // Or just derive it. For MVP, we'll let the user navigate but show locked state if previous week not done.

  return (
    <StoreContext.Provider
      value={{
        user,
        toggleCreatorMode,
        syllabi,
        enrollment,
        enrollInSyllabus,
        markStepComplete,
        markStepIncomplete,
        saveExercise,
        createSyllabus,
        updateSyllabus,
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
