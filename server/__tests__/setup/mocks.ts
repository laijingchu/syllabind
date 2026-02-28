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
  isCurator: false,
  isAdmin: false,
  bio: null,
  expertise: null,
  avatarUrl: null,
  linkedin: null,
  website: null,
  twitter: null,
  threads: null,
  schedulingUrl: null,
  shareProfile: false,
  authProvider: 'email',
  stripeCustomerId: null,
  subscriptionStatus: 'free',
};

// Mock admin user (non-curator admin — tests admin bypass without curator flag)
export const mockAdmin = {
  id: 'admin-user-id-789',
  username: 'adminuser',
  name: 'Admin User',
  email: 'admin@example.com',
  password: null,
  replitId: null,
  googleId: null,
  appleId: null,
  isCurator: false,
  isAdmin: true,
  bio: null,
  expertise: null,
  avatarUrl: null,
  linkedin: null,
  website: null,
  twitter: null,
  threads: null,
  schedulingUrl: null,
  shareProfile: false,
  authProvider: 'email',
  stripeCustomerId: null,
  subscriptionStatus: 'free',
};

// Mock curator user
export const mockCurator = {
  id: 'curator-user-id-456',
  username: 'testcurator',
  name: 'Test Curator',
  email: 'curator@example.com',
  password: null,
  replitId: null,
  googleId: null,
  appleId: null,
  isCurator: true,
  isAdmin: false,
  bio: 'Test curator bio',
  expertise: 'Test expertise',
  avatarUrl: null,
  linkedin: 'testcurator',
  website: null,
  twitter: null,
  threads: null,
  schedulingUrl: 'https://calendly.com/testcurator',
  shareProfile: true,
  authProvider: 'email',
  stripeCustomerId: null,
  subscriptionStatus: 'free',
};

// Mock Pro user (curator with Pro subscription)
export const mockProCurator = {
  ...mockCurator,
  id: 'pro-curator-id-789',
  username: 'procurator',
  subscriptionStatus: 'pro',
  stripeCustomerId: 'cus_pro123',
};

// Mock Pro user (reader with Pro subscription)
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
  if (mockStorage.getBinder) mockStorage.getBinder.mockResolvedValue(null);
  if (mockStorage.getBinderWithContent) mockStorage.getBinderWithContent.mockResolvedValue(null);
  if (mockStorage.getBindersByCurator) mockStorage.getBindersByCurator.mockResolvedValue([]);
  if (mockStorage.listBinders) mockStorage.listBinders.mockResolvedValue([]);
  if (mockStorage.createBinder) mockStorage.createBinder.mockResolvedValue({ id: 1 });
  if (mockStorage.updateBinder) mockStorage.updateBinder.mockResolvedValue(undefined);
  if (mockStorage.deleteBinder) mockStorage.deleteBinder.mockResolvedValue(undefined);
  if (mockStorage.batchDeleteBinders) mockStorage.batchDeleteBinders.mockResolvedValue(undefined);
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
  if (mockStorage.getReadersByBinderId) mockStorage.getReadersByBinderId.mockResolvedValue([]);
  if (mockStorage.getClassmatesByBinderId) mockStorage.getClassmatesByBinderId.mockResolvedValue({ classmates: [], totalEnrolled: 0 });
  if (mockStorage.getBinderAnalytics) mockStorage.getBinderAnalytics.mockResolvedValue({});
  if (mockStorage.getStepCompletionRates) mockStorage.getStepCompletionRates.mockResolvedValue([]);
  if (mockStorage.getAverageCompletionTimes) mockStorage.getAverageCompletionTimes.mockResolvedValue([]);
  if (mockStorage.getStep) mockStorage.getStep.mockResolvedValue(null);
  if (mockStorage.getWeek) mockStorage.getWeek.mockResolvedValue(null);
  if (mockStorage.deleteStep) mockStorage.deleteStep.mockResolvedValue(undefined);
  if (mockStorage.updateStepUrl) mockStorage.updateStepUrl.mockResolvedValue(undefined);
  if (mockStorage.updateStep) mockStorage.updateStep.mockResolvedValue(undefined);
  if (mockStorage.getUserByStripeCustomerId) mockStorage.getUserByStripeCustomerId.mockResolvedValue(null);
  if (mockStorage.getSubscriptionByStripeId) mockStorage.getSubscriptionByStripeId.mockResolvedValue(null);
  if (mockStorage.upsertSubscription) mockStorage.upsertSubscription.mockResolvedValue({ id: 1 });
  if (mockStorage.updateSubscriptionByStripeId) mockStorage.updateSubscriptionByStripeId.mockResolvedValue(undefined);
  if (mockStorage.countBindersByCurator) mockStorage.countBindersByCurator.mockResolvedValue(0);
  if (mockStorage.getSiteSetting) mockStorage.getSiteSetting.mockResolvedValue(null);
  if (mockStorage.setSiteSetting) mockStorage.setSiteSetting.mockResolvedValue(undefined);
  if (mockStorage.initializeDefaultCategories) mockStorage.initializeDefaultCategories.mockResolvedValue(undefined);
  if (mockStorage.listCategories) mockStorage.listCategories.mockResolvedValue([]);
  if (mockStorage.listTags) mockStorage.listTags.mockResolvedValue([]);
  if (mockStorage.getTagsByBinderId) mockStorage.getTagsByBinderId.mockResolvedValue([]);
  if (mockStorage.findOrCreateTag) mockStorage.findOrCreateTag.mockResolvedValue({ id: 1, name: 'test', slug: 'test' });
  if (mockStorage.setBinderTags) mockStorage.setBinderTags.mockResolvedValue([]);
  if (mockStorage.searchCatalog) mockStorage.searchCatalog.mockResolvedValue({ binders: [], total: 0 });
  if (mockStorage.refreshSearchVector) mockStorage.refreshSearchVector.mockResolvedValue(undefined);
  if (mockStorage.deleteUser) mockStorage.deleteUser.mockResolvedValue(undefined);
};
