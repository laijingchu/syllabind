import { Syllabus, User, Enrollment, LearnerProfile } from './types';

export const MOCK_USER: User = {
  id: 'user-1',
  username: 'alexlearner',
  name: 'Alex Learner',
  isCreator: false,
  bio: 'Lifelong learner passionate about technology and design.',
  linkedin: 'alexlearner',
  twitter: 'alexlearner',
  shareProfile: true,
};

export const MOCK_LEARNERS: LearnerProfile[] = [
  {
    user: {
      id: 'user-2',
      username: 'sarahchen',
      name: 'Sarah Chen',
      isCreator: false,
      avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah',
      bio: 'Product Designer at TechCo',
      linkedin: 'sarahchen',
      twitter: 'schen_design',
    },
    status: 'completed',
    joinedDate: '2023-10-15',
  },
  {
    user: {
      id: 'user-3',
      username: 'marcusj',
      name: 'Marcus Johnson',
      isCreator: false,
      avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus',
      bio: 'Software Engineer learning design systems',
      website: 'https://marcus.dev',
    },
    status: 'in-progress',
    joinedDate: '2023-11-02',
  },
  {
    user: {
      id: 'user-4',
      username: 'emilyd',
      name: 'Emily Davis',
      isCreator: false,
      avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Emily',
      bio: 'Marketing Specialist',
      threads: 'emilyd_marketing',
    },
    status: 'in-progress',
    joinedDate: '2023-11-10',
  },
  {
    user: {
      id: 'user-5',
      username: 'davidw',
      name: 'David Wilson',
      isCreator: false,
      avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=David',
    },
    status: 'completed',
    joinedDate: '2023-09-20',
  }
];

export const INITIAL_ENROLLMENT: Enrollment = {
  activeSyllabusId: null,
  currentWeekIndex: 1,
  completedStepIds: [],
  completedSyllabusIds: [],
};

export const MOCK_SYLLABINDS: Syllabus[] = [
  {
    id: 1,
    title: 'Digital Minimalism',
    description: 'Reclaim your attention and focus in a noisy world. A 4-week structured guide to reducing digital clutter.',
    audienceLevel: 'Beginner',
    durationWeeks: 4,
    status: 'published',
    creatorId: 'creator-1',
    weeks: [
      {
        id: 1,
        syllabusId: 1,
        index: 1,
        title: 'The Philosophy of Less',
        steps: [
          {
            id: 1,
            weekId: 1,
            position: 1,
            type: 'reading',
            title: 'Why We Are Distracted',
            url: 'https://example.com/distracted',
            note: 'A foundational essay on attention economy.',
            estimatedMinutes: 15,
          },
          {
            id: 2,
            weekId: 1,
            position: 2,
            type: 'exercise',
            title: 'Audit Your Screen Time',
            promptText: 'Check your phone usage stats for the last week. Write down the top 3 apps stealing your time.',
            estimatedMinutes: 10,
          },
        ],
      },
      {
        id: 2,
        syllabusId: 1,
        index: 2,
        title: 'Digital Declutter',
        steps: [
          {
            id: 3,
            weekId: 2,
            position: 1,
            type: 'reading',
            title: 'The 30-Day Declutter Method',
            url: 'https://example.com/declutter',
            estimatedMinutes: 20,
          },
          {
            id: 4,
            weekId: 2,
            position: 2,
            type: 'exercise',
            title: 'Delete 5 Apps',
            promptText: 'Identify 5 apps that do not bring you joy or utility and delete them right now.',
            estimatedMinutes: 5,
          },
        ],
      },
      {
        id: 3,
        syllabusId: 1,
        index: 3,
        title: 'Reclaiming Leisure',
        steps: [
            {
                id: 5,
                weekId: 3,
                position: 1,
                type: 'reading',
                title: 'The Value of Boredom',
                url: 'https://example.com/boredom',
                estimatedMinutes: 25,
            },
            {
                id: 6,
                weekId: 3,
                position: 2,
                type: 'exercise',
                title: 'A Walk Without Phone',
                promptText: 'Go for a 30-minute walk without your phone. Notice 5 things you usually miss.',
                estimatedMinutes: 30,
            }
        ],
      },
      {
        id: 4,
        syllabusId: 1,
        index: 4,
        title: 'Deep Work Habits',
        steps: [
            {
                id: 7,
                weekId: 4,
                position: 1,
                type: 'reading',
                title: 'Deep Work: Rules for Focused Success',
                url: 'https://example.com/deepwork',
                estimatedMinutes: 40,
            },
            {
                id: 8,
                weekId: 4,
                position: 2,
                type: 'exercise',
                title: 'Schedule Deep Work Blocks',
                promptText: 'Plan your next week. Block out at least three 90-minute sessions for deep work.',
                estimatedMinutes: 15,
            }
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Systems Thinking 101',
    description: 'Learn to see the world in loops and connections. Understand feedback loops, stocks, and flows.',
    audienceLevel: 'Intermediate',
    durationWeeks: 2,
    status: 'published',
    creatorId: 'creator-1',
    weeks: [
      {
        id: 5,
        syllabusId: 2,
        index: 1,
        title: 'Basics of Systems',
        steps: [
          {
            id: 9,
            weekId: 5,
            position: 1,
            type: 'reading',
            title: 'Thinking in Systems: A Primer (Chapter 1)',
            url: 'https://example.com/systems',
            estimatedMinutes: 30,
          }
        ],
      },
      {
        id: 6,
        syllabusId: 2,
        index: 2,
        title: 'Feedback Loops',
        steps: [],
      },
    ],
  },
];
