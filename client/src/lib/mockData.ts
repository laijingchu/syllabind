import { Syllabus, User, Enrollment } from './types';

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Alex Learner',
  isCreator: false,
};

export const INITIAL_ENROLLMENT: Enrollment = {
  activeSyllabusId: null,
  currentWeekIndex: 1,
  completedStepIds: [],
  completedSyllabusIds: [],
};

export const MOCK_SYLLABI: Syllabus[] = [
  {
    id: 'syl-1',
    title: 'Digital Minimalism',
    description: 'Reclaim your attention and focus in a noisy world. A 4-week structured guide to reducing digital clutter.',
    audienceLevel: 'Beginner',
    durationWeeks: 4,
    status: 'published',
    creatorId: 'creator-1',
    weeks: [
      {
        index: 1,
        title: 'The Philosophy of Less',
        steps: [
          {
            id: 'step-1-1',
            type: 'reading',
            title: 'Why We Are Distracted',
            url: 'https://example.com/distracted',
            note: 'A foundational essay on attention economy.',
            estimatedMinutes: 15,
          },
          {
            id: 'step-1-2',
            type: 'exercise',
            title: 'Audit Your Screen Time',
            promptText: 'Check your phone usage stats for the last week. Write down the top 3 apps stealing your time.',
            estimatedMinutes: 10,
          },
        ],
      },
      {
        index: 2,
        title: 'Digital Declutter',
        steps: [
          {
            id: 'step-2-1',
            type: 'reading',
            title: 'The 30-Day Declutter Method',
            url: 'https://example.com/declutter',
            estimatedMinutes: 20,
          },
          {
            id: 'step-2-2',
            type: 'exercise',
            title: 'Delete 5 Apps',
            promptText: 'Identify 5 apps that do not bring you joy or utility and delete them right now.',
            estimatedMinutes: 5,
          },
        ],
      },
      {
        index: 3,
        title: 'Reclaiming Leisure',
        steps: [],
      },
      {
        index: 4,
        title: 'Deep Work Habits',
        steps: [],
      },
    ],
  },
  {
    id: 'syl-2',
    title: 'Systems Thinking 101',
    description: 'Learn to see the world in loops and connections. Understand feedback loops, stocks, and flows.',
    audienceLevel: 'Intermediate',
    durationWeeks: 2,
    status: 'published',
    creatorId: 'creator-1',
    weeks: [
      {
        index: 1,
        title: 'Basics of Systems',
        steps: [
          {
            id: 'step-st-1',
            type: 'reading',
            title: 'Thinking in Systems: A Primer (Chapter 1)',
            url: 'https://example.com/systems',
            estimatedMinutes: 30,
          }
        ],
      },
      {
        index: 2,
        title: 'Feedback Loops',
        steps: [],
      },
    ],
  },
];
