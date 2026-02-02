/// <reference types="jest" />

// Mock user for testing
export const mockUser = {
  id: 'test-user-id-123',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  isCreator: false,
  bio: null,
  expertise: null,
  avatarUrl: null,
  linkedin: null,
  website: null,
  twitter: null,
  threads: null,
  shareProfile: false
};

// Mock creator user
export const mockCreator = {
  id: 'creator-user-id-456',
  username: 'testcreator',
  name: 'Test Creator',
  email: 'creator@example.com',
  isCreator: true,
  bio: 'Test creator bio',
  expertise: 'Test expertise',
  avatarUrl: null,
  linkedin: 'testcreator',
  website: null,
  twitter: null,
  threads: null,
  shareProfile: true
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
export const mockStorage = require('../../storage').default || require('../../storage');

// Export reset function for test cleanup
export const resetAllMocks = () => {
  jest.clearAllMocks();

  // Reset mock implementations to defaults
  if (mockStorage.getUserByEmail) mockStorage.getUserByEmail.mockResolvedValue(null);
  if (mockStorage.getUserByUsername) mockStorage.getUserByUsername.mockResolvedValue(null);
  if (mockStorage.createUser) mockStorage.createUser.mockResolvedValue(mockUser);
  if (mockStorage.updateUser) mockStorage.updateUser.mockResolvedValue(mockUser);
  if (mockStorage.getAllSyllabi) mockStorage.getAllSyllabi.mockResolvedValue([]);
  if (mockStorage.getSyllabusById) mockStorage.getSyllabusById.mockResolvedValue(null);
  if (mockStorage.createSyllabus) mockStorage.createSyllabus.mockResolvedValue({ id: 1 });
  if (mockStorage.updateSyllabus) mockStorage.updateSyllabus.mockResolvedValue(undefined);
  if (mockStorage.deleteSyllabus) mockStorage.deleteSyllabus.mockResolvedValue(undefined);
  if (mockStorage.getEnrollmentsByUserId) mockStorage.getEnrollmentsByUserId.mockResolvedValue([]);
  if (mockStorage.createEnrollment) mockStorage.createEnrollment.mockResolvedValue({ id: 1 });
  if (mockStorage.updateEnrollment) mockStorage.updateEnrollment.mockResolvedValue(undefined);
  if (mockStorage.getCompletedSteps) mockStorage.getCompletedSteps.mockResolvedValue([]);
  if (mockStorage.markStepComplete) mockStorage.markStepComplete.mockResolvedValue(undefined);
  if (mockStorage.markStepIncomplete) mockStorage.markStepIncomplete.mockResolvedValue(undefined);
  if (mockStorage.getSubmissionsByEnrollmentId) mockStorage.getSubmissionsByEnrollmentId.mockResolvedValue([]);
  if (mockStorage.createSubmission) mockStorage.createSubmission.mockResolvedValue({ id: 1 });
  if (mockStorage.updateSubmission) mockStorage.updateSubmission.mockResolvedValue(undefined);
  if (mockStorage.getLearnersBySyllabusId) mockStorage.getLearnersBySyllabusId.mockResolvedValue([]);
};
