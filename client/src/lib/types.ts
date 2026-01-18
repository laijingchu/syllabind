export type AudienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type StepType = 'reading' | 'exercise';
export type SyllabusStatus = 'draft' | 'published';

export interface Step {
  id: string;
  type: StepType;
  title: string;
  url?: string; // For readings
  note?: string; // Short context
  promptText?: string; // For exercises
  estimatedMinutes?: number;
}

export interface Week {
  index: number; // 1-4
  title?: string; // e.g. "Foundations"
  description?: string; // Weekly summary
  steps: Step[];
}

export interface Syllabus {
  id: string;
  title: string;
  description: string;
  audienceLevel: AudienceLevel;
  durationWeeks: number; // 1-4
  status: SyllabusStatus;
  weeks: Week[];
  creatorId: string;
}

export interface Enrollment {
  activeSyllabusId: string | null;
  currentWeekIndex: number; // 1-based
  completedStepIds: string[]; // List of completed step IDs
  completedSyllabusIds: string[]; // List of fully completed syllabus IDs
}

export interface Submission {
  stepId: string;
  answer: string; // URL or text
  submittedAt: string;
  isShared: boolean; // Learner opt-in
  
  // Creator feedback
  feedback?: string; // Rich text
  grade?: string; // e.g. "A", "Pass", "85/100"
  rubricUrl?: string; // URL to grading rubric
}

export interface Cohort {
  id: string;
  name: string;
  syllabusId: string;
  learnerIds: string[];
}

export interface User {
  id: string;
  name: string;
  email?: string;
  isCreator: boolean;
  bio?: string;
  expertise?: string;
  avatarUrl?: string;
  // Social links
  linkedin?: string;
  website?: string;
  twitter?: string;
  threads?: string;
  // Preferences
  shareProfile?: boolean;
}

export interface LearnerProfile {
  user: User;
  status: 'in-progress' | 'completed';
  joinedDate: string;
  cohortId?: string; // Assigned cohort
}
