/// <reference types="jest" />

// Mock user for testing
export const mockUser = {
  id: 'test-user-id-123',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  password: null,
  replitId: null,
  googleId: null,
  appleId: null,
  isCreator: false,
  isAdmin: false,
  bio: null,
  expertise: null,
  avatarUrl: null,
  linkedin: null,
  website: null,
  twitter: null,
  threads: null,
  shareProfile: false,
  authProvider: 'email',
  stripeCustomerId: null,
  subscriptionStatus: 'free',
};

// Mock admin user (non-creator admin — tests admin bypass without creator flag)
export const mockAdmin = {
  id: 'admin-user-id-789',
  username: 'adminuser',
  name: 'Admin User',
  email: 'admin@example.com',
  password: null,
  replitId: null,
  googleId: null,
  appleId: null,
  isCreator: false,
  isAdmin: true,
  bio: null,
  expertise: null,
  avatarUrl: null,
  linkedin: null,
  website: null,
  twitter: null,
  threads: null,
  shareProfile: false,
  authProvider: 'email',
  stripeCustomerId: null,
  subscriptionStatus: 'free',
};

// Mock creator user
export const mockCreator = {
  id: 'creator-user-id-456',
  username: 'testcreator',
  name: 'Test Creator',
  email: 'creator@example.com',
  password: null,
  replitId: null,
  googleId: null,
  appleId: null,
  isCreator: true,
  isAdmin: false,
  bio: 'Test creator bio',
  expertise: 'Test expertise',
  avatarUrl: null,
  linkedin: 'testcreator',
  website: null,
  twitter: null,
  threads: null,
  shareProfile: true,
  authProvider: 'email',
  stripeCustomerId: null,
  subscriptionStatus: 'free',
};

// Mock Pro user (creator with Pro subscription)
export const mockProCreator = {
  ...mockCreator,
  id: 'pro-creator-id-789',
  username: 'procreator',
  subscriptionStatus: 'pro',
  stripeCustomerId: 'cus_pro123',
};

// Mock Pro user (learner with Pro subscription)
export const mockProUser = {
  ...mockUser,
  id: 'pro-user-id-101',
  username: 'prouser',
  subscriptionStatus: 'pro',
  stripeCustomerId: 'cus_prouser123',
};

// Mock authenticated request
export const createAuthenticatedRequest = (user = mockUser, overrides = {}) => ({
  isAuthenticated: () => true,
  user: user,
  session: {
    passport: {
      user: user.id
    }
  },
  ...overrides
});

// Mock unauthenticated request
export const createUnauthenticatedRequest = () => ({
  isAuthenticated: () => false,
  user: undefined,
  session: {}
});

// Import the storage mock from the global jest setup
const storageMod = require('../../storage');
export const mockStorage = storageMod.storage || storageMod;

// Export reset function for test cleanup
export const resetAllMocks = () => {
  jest.clearAllMocks();

  // Reset mock implementations to defaults
  if (mockStorage.getUserByEmail) mockStorage.getUserByEmail.mockResolvedValue(null);
  if (mockStorage.getUserByUsername) mockStorage.getUserByUsername.mockResolvedValue(null);
  if (mockStorage.getUser) mockStorage.getUser.mockResolvedValue(null);
  if (mockStorage.createUser) mockStorage.createUser.mockResolvedValue(mockUser);
  if (mockStorage.updateUser) mockStorage.updateUser.mockResolvedValue(mockUser);
  if (mockStorage.getSyllabusById) mockStorage.getSyllabusById.mockResolvedValue(null);
  if (mockStorage.getSyllabus) mockStorage.getSyllabus.mockResolvedValue(null);
  if (mockStorage.getSyllabusWithContent) mockStorage.getSyllabusWithContent.mockResolvedValue(null);
  if (mockStorage.getSyllabindsByCreator) mockStorage.getSyllabindsByCreator.mockResolvedValue([]);
  if (mockStorage.listSyllabinds) mockStorage.listSyllabinds.mockResolvedValue([]);
  if (mockStorage.createSyllabus) mockStorage.createSyllabus.mockResolvedValue({ id: 1 });
  if (mockStorage.updateSyllabus) mockStorage.updateSyllabus.mockResolvedValue(undefined);
  if (mockStorage.deleteSyllabus) mockStorage.deleteSyllabus.mockResolvedValue(undefined);
  if (mockStorage.batchDeleteSyllabinds) mockStorage.batchDeleteSyllabinds.mockResolvedValue(undefined);
  if (mockStorage.getEnrollmentsByUserId) mockStorage.getEnrollmentsByUserId.mockResolvedValue([]);
  if (mockStorage.getUserEnrollments) mockStorage.getUserEnrollments.mockResolvedValue([]);
  if (mockStorage.getEnrollment) mockStorage.getEnrollment.mockResolvedValue(null);
  if (mockStorage.getEnrollmentById) mockStorage.getEnrollmentById.mockResolvedValue(null);
  if (mockStorage.createEnrollment) mockStorage.createEnrollment.mockResolvedValue({ id: 1 });
  if (mockStorage.updateEnrollment) mockStorage.updateEnrollment.mockResolvedValue(undefined);
  if (mockStorage.dropActiveEnrollments) mockStorage.dropActiveEnrollments.mockResolvedValue(undefined);
  if (mockStorage.updateEnrollmentShareProfile) mockStorage.updateEnrollmentShareProfile.mockResolvedValue(undefined);
  if (mockStorage.getCompletedSteps) mockStorage.getCompletedSteps.mockResolvedValue([]);
  if (mockStorage.markStepComplete) mockStorage.markStepComplete.mockResolvedValue(undefined);
  if (mockStorage.markStepCompleted) mockStorage.markStepCompleted.mockResolvedValue(undefined);
  if (mockStorage.markStepIncomplete) mockStorage.markStepIncomplete.mockResolvedValue(undefined);
  if (mockStorage.getSubmissionsByEnrollmentId) mockStorage.getSubmissionsByEnrollmentId.mockResolvedValue([]);
  if (mockStorage.getSubmission) mockStorage.getSubmission.mockResolvedValue(null);
  if (mockStorage.createSubmission) mockStorage.createSubmission.mockResolvedValue({ id: 1 });
  if (mockStorage.updateSubmission) mockStorage.updateSubmission.mockResolvedValue(undefined);
  if (mockStorage.updateSubmissionFeedback) mockStorage.updateSubmissionFeedback.mockResolvedValue(undefined);
  if (mockStorage.getLearnersBySyllabusId) mockStorage.getLearnersBySyllabusId.mockResolvedValue([]);
  if (mockStorage.getClassmatesBySyllabusId) mockStorage.getClassmatesBySyllabusId.mockResolvedValue({ classmates: [], totalEnrolled: 0 });
  if (mockStorage.getSyllabusAnalytics) mockStorage.getSyllabusAnalytics.mockResolvedValue({});
  if (mockStorage.getStepCompletionRates) mockStorage.getStepCompletionRates.mockResolvedValue([]);
  if (mockStorage.getAverageCompletionTimes) mockStorage.getAverageCompletionTimes.mockResolvedValue([]);
  if (mockStorage.getStep) mockStorage.getStep.mockResolvedValue(null);
  if (mockStorage.getWeek) mockStorage.getWeek.mockResolvedValue(null);
  if (mockStorage.deleteStep) mockStorage.deleteStep.mockResolvedValue(undefined);
  if (mockStorage.getChatMessages) mockStorage.getChatMessages.mockResolvedValue([]);
  if (mockStorage.createChatMessage) mockStorage.createChatMessage.mockResolvedValue({ id: 1 });
  if (mockStorage.clearChatMessages) mockStorage.clearChatMessages.mockResolvedValue(undefined);
  if (mockStorage.updateStepUrl) mockStorage.updateStepUrl.mockResolvedValue(undefined);
  if (mockStorage.getUserByStripeCustomerId) mockStorage.getUserByStripeCustomerId.mockResolvedValue(null);
  if (mockStorage.getSubscriptionByStripeId) mockStorage.getSubscriptionByStripeId.mockResolvedValue(null);
  if (mockStorage.upsertSubscription) mockStorage.upsertSubscription.mockResolvedValue({ id: 1 });
  if (mockStorage.updateSubscriptionByStripeId) mockStorage.updateSubscriptionByStripeId.mockResolvedValue(undefined);
  if (mockStorage.countSyllabindsByCreator) mockStorage.countSyllabindsByCreator.mockResolvedValue(0);
};
