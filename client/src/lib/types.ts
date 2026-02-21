export type AudienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type StepType = 'reading' | 'exercise';
export type SyllabusStatus = 'draft' | 'published' | 'generating';

export interface Step {
  id: number; // Changed from string to number for normalized DB
  weekId: number; // Foreign key to weeks table
  position: number; // Order within week
  type: StepType;
  title: string;
  url?: string; // For readings
  note?: string; // Short context

  // New Metadata Fields
  author?: string;
  creationDate?: string; // or publish date
  mediaType?: 'Book' | 'Book Chapter' | 'Journal Article' | 'Youtube video' | 'Blog/Article' | 'Podcast';

  promptText?: string; // For exercises
  estimatedMinutes?: number;
}

export interface Week {
  id: number; // Primary key
  syllabusId: number; // Foreign key to syllabinds table
  index: number; // 1-4
  title?: string; // e.g. "Foundations"
  description?: string; // Weekly summary
  steps: Step[];
}

export interface CreatorProfile {
  name: string | null;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  expertise: string | null;
  profileTitle: string | null;
  linkedin: string | null;
  twitter: string | null;
  threads: string | null;
  website: string | null;
  schedulingUrl: string | null;
}

export interface Syllabus {
  id: number; // Changed from string to number for normalized DB
  title: string;
  description: string;
  audienceLevel: AudienceLevel;
  durationWeeks: number; // 1-4
  status: SyllabusStatus;
  weeks: Week[];
  creatorId: string; // Username (unique) instead of UUID
  creator?: CreatorProfile; // Populated when listing syllabinds
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface Enrollment {
  id?: number; // Enrollment ID
  activeSyllabusId: number | null; // Changed from string to number
  currentWeekIndex: number; // 1-based
  completedStepIds: number[]; // Changed from string[] to number[]
  completedSyllabusIds: number[]; // Changed from string[] to number[]
}

export interface Submission {
  id?: number; // Submission ID
  enrollmentId: number; // Which enrollment this belongs to
  stepId: number; // Changed from string to number
  answer: string; // URL or text
  submittedAt: string;
  isShared: boolean; // Learner opt-in

  // Creator feedback
  feedback?: string; // Rich text
  grade?: string; // e.g. "A", "Pass", "85/100"
  rubricUrl?: string; // URL to grading rubric
}

export interface CompletedStep {
  enrollmentId: number;
  stepId: number;
  completedAt: string; // ISO timestamp
}

export interface Cohort {
  id: number;
  name: string;
  syllabusId: number;               // FK to syllabinds
  creatorId?: string;               // Username of creator
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CohortMember {
  cohortId: number;
  studentId: string;                // Username of student
  joinedAt: string;
  role: string;                     // 'member', 'moderator', etc.
}

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  isCreator: boolean;
  isAdmin?: boolean;
  bio?: string;
  expertise?: string;
  profileTitle?: string;
  avatarUrl?: string;
  // Social links
  linkedin?: string;
  website?: string;
  twitter?: string;
  threads?: string;
  schedulingUrl?: string;
  // Preferences
  shareProfile?: boolean;
  // Subscription
  stripeCustomerId?: string | null;
  subscriptionStatus?: 'free' | 'pro' | 'past_due';
}

export interface SubscriptionLimits {
  syllabindCount: number;
  syllabindLimit: number | null;
  canCreateMore: boolean;
  canEnroll: boolean;
  isPro: boolean;
}

export interface LearnerProfile {
  user: User;
  status: 'in-progress' | 'completed';
  joinedDate: string;
  cohortId?: string; // Assigned cohort
}
