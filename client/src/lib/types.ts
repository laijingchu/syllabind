export type AudienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type StepType = 'reading' | 'exercise';
export type BinderStatus = 'draft' | 'published' | 'generating';
export type BinderVisibility = 'public' | 'unlisted' | 'private';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

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
  binderId: number; // Foreign key to binders table
  index: number; // 1-4
  title?: string; // e.g. "Foundations"
  description?: string; // Weekly summary
  steps: Step[];
}

export interface CuratorProfile {
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

export interface Binder {
  id: number; // Changed from string to number for normalized DB
  title: string;
  description: string;
  audienceLevel: AudienceLevel;
  durationWeeks: number; // 1-4
  status: BinderStatus;
  visibility?: BinderVisibility;
  weeks: Week[];
  showSchedulingLink?: boolean;
  isDemo?: boolean;
  mediaPreference?: 'auto' | 'yes' | 'no';
  curatorId: string; // Username (unique) instead of UUID
  curator?: CuratorProfile; // Populated when listing binders
  categoryId?: number | null;
  category?: { name: string; slug: string } | null;
  tags?: Tag[];
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface Enrollment {
  id?: number; // Enrollment ID
  activeBinderId: number | null; // Changed from string to number
  currentWeekIndex: number; // 1-based
  completedStepIds: number[]; // Changed from string[] to number[]
  completedBinderIds: number[]; // Changed from string[] to number[]
}

export interface Submission {
  id?: number; // Submission ID
  enrollmentId: number; // Which enrollment this belongs to
  stepId: number; // Changed from string to number
  answer: string; // URL or text
  submittedAt: string;
  isShared: boolean; // Reader opt-in

  // Curator feedback
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
  binderId: number;               // FK to binders
  curatorId?: string;             // Username of curator
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CohortMember {
  cohortId: number;
  readerId: string;               // Username of reader
  joinedAt: string;
  role: string;                   // 'member', 'moderator', etc.
}

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  isCurator: boolean;
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
  // Generation tracking
  generationCount?: number;
  lastGeneratedAt?: string | null;
}

export interface SubscriptionLimits {
  binderCount: number;
  binderLimit: number | null;
  canCreateMore: boolean;
  canEnroll: boolean;
  isPro: boolean;
}

export interface ReaderProfile {
  user: User;
  status: 'in-progress' | 'completed';
  joinedDate: string;
  cohortId?: string; // Assigned cohort
}
