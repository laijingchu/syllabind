import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Syllabus, Enrollment } from './types';
import { MOCK_SYLLABI, INITIAL_ENROLLMENT } from './mockData';

interface StoreContextType {
  user: any;
  isAuthenticated: boolean;
  logout: () => void;
  isLoading: boolean;
  
  // Stubs for now
  syllabi: Syllabus[];
  enrollment: Enrollment;
  toggleCreatorMode: () => void;
  completeActiveSyllabus: () => void;
  updateEnrollment: (updates: Partial<Enrollment>) => void;
  completeStep: (stepId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [syllabi] = useState<Syllabus[]>(MOCK_SYLLABI);
  const [enrollment, setEnrollment] = useState<Enrollment>(INITIAL_ENROLLMENT);

  const toggleCreatorMode = () => {
    console.log("Toggle creator mode requested");
  };

  const completeActiveSyllabus = () => {
    console.log("Complete active syllabus requested");
  };

  const updateEnrollment = (updates: Partial<Enrollment>) => {
    setEnrollment(prev => ({ ...prev, ...updates }));
  };

  const completeStep = (stepId: string) => {
    if (!enrollment.completedStepIds.includes(stepId)) {
      updateEnrollment({
        completedStepIds: [...enrollment.completedStepIds, stepId]
      });
    }
  };

  return (
    <StoreContext.Provider value={{ 
      user, 
      isAuthenticated, 
      logout, 
      isLoading,
      syllabi,
      enrollment,
      toggleCreatorMode,
      completeActiveSyllabus,
      updateEnrollment,
      completeStep
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
