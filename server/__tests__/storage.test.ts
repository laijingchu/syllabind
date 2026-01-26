import { resetAllMocks, mockStorage, mockUser, mockCreator } from './setup/mocks';

// Import and apply mocks
import './setup/mocks';

describe('Storage Layer', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('User Storage Operations', () => {
    describe('getUserByEmail', () => {
      it('should retrieve user by email', async () => {
        mockStorage.getUserByEmail.mockResolvedValue(mockUser);

        const result = await mockStorage.getUserByEmail('test@example.com');

        expect(mockStorage.getUserByEmail).toHaveBeenCalledWith('test@example.com');
        expect(result).toEqual(mockUser);
      });

      it('should return null when email not found', async () => {
        mockStorage.getUserByEmail.mockResolvedValue(null);

        const result = await mockStorage.getUserByEmail('nonexistent@example.com');

        expect(result).toBeNull();
      });
    });

    describe('getUserByUsername', () => {
      it('should retrieve user by username', async () => {
        mockStorage.getUserByUsername.mockResolvedValue(mockUser);

        const result = await mockStorage.getUserByUsername('testuser');

        expect(mockStorage.getUserByUsername).toHaveBeenCalledWith('testuser');
        expect(result).toEqual(mockUser);
      });

      it('should return null when username not found', async () => {
        mockStorage.getUserByUsername.mockResolvedValue(null);

        const result = await mockStorage.getUserByUsername('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('createUser', () => {
      it('should create new user with required fields', async () => {
        const newUserData = {
          username: 'newuser',
          name: 'New User',
          email: 'new@example.com',
          passwordHash: '$2a$10$hashedpassword',
          isCreator: false
        };

        const createdUser = {
          ...newUserData,
          id: 'new-user-id'
        };

        mockStorage.createUser.mockResolvedValue(createdUser);

        const result = await mockStorage.createUser(newUserData);

        expect(mockStorage.createUser).toHaveBeenCalledWith(newUserData);
        expect(result.id).toBeDefined();
        expect(result.email).toEqual(newUserData.email);
      });

      it('should handle duplicate user creation', async () => {
        const duplicateError = new Error('User already exists');
        mockStorage.createUser.mockRejectedValue(duplicateError);

        await expect(mockStorage.createUser(mockUser))
          .rejects.toThrow('User already exists');
      });
    });

    describe('updateUser', () => {
      it('should update user with partial data', async () => {
        const updateData = {
          name: 'Updated Name',
          bio: 'Updated bio'
        };

        const updatedUser = {
          ...mockUser,
          ...updateData
        };

        mockStorage.updateUser.mockResolvedValue(updatedUser);

        const result = await mockStorage.updateUser('test-user-id-123', updateData);

        expect(mockStorage.updateUser).toHaveBeenCalledWith('test-user-id-123', updateData);
        expect(result.name).toEqual('Updated Name');
        expect(result.bio).toEqual('Updated bio');
      });
    });
  });

  describe('Syllabus Storage Operations', () => {
    const mockSyllabus = {
      id: 1,
      title: 'Test Syllabus',
      description: 'Test description',
      audienceLevel: 'Beginner' as const,
      durationWeeks: 4,
      status: 'published' as const,
      creatorId: 'testcreator',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    describe('getAllSyllabi', () => {
      it('should retrieve all syllabi', async () => {
        mockStorage.getAllSyllabi.mockResolvedValue([mockSyllabus]);

        const result = await mockStorage.getAllSyllabi();

        expect(mockStorage.getAllSyllabi).toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockSyllabus);
      });

      it('should return empty array when no syllabi exist', async () => {
        mockStorage.getAllSyllabi.mockResolvedValue([]);

        const result = await mockStorage.getAllSyllabi();

        expect(result).toEqual([]);
      });
    });

    describe('getSyllabusById', () => {
      it('should retrieve syllabus by ID', async () => {
        mockStorage.getSyllabusById.mockResolvedValue(mockSyllabus);

        const result = await mockStorage.getSyllabusById(1);

        expect(mockStorage.getSyllabusById).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockSyllabus);
      });

      it('should return null when syllabus not found', async () => {
        mockStorage.getSyllabusById.mockResolvedValue(null);

        const result = await mockStorage.getSyllabusById(999);

        expect(result).toBeNull();
      });
    });

    describe('createSyllabus', () => {
      it('should create new syllabus', async () => {
        const newSyllabus = {
          title: 'New Syllabus',
          description: 'New description',
          audienceLevel: 'Intermediate' as const,
          durationWeeks: 2,
          status: 'draft' as const,
          creatorId: 'testcreator'
        };

        mockStorage.createSyllabus.mockResolvedValue({ id: 2, ...newSyllabus });

        const result = await mockStorage.createSyllabus(newSyllabus);

        expect(mockStorage.createSyllabus).toHaveBeenCalledWith(newSyllabus);
        expect(result.id).toBeDefined();
        expect(result.title).toEqual(newSyllabus.title);
      });
    });

    describe('updateSyllabus', () => {
      it('should update syllabus', async () => {
        const updateData = {
          title: 'Updated Title',
          status: 'published' as const
        };

        mockStorage.updateSyllabus.mockResolvedValue(undefined);

        await mockStorage.updateSyllabus(1, updateData);

        expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, updateData);
      });
    });

    describe('deleteSyllabus', () => {
      it('should delete syllabus', async () => {
        mockStorage.deleteSyllabus.mockResolvedValue(undefined);

        await mockStorage.deleteSyllabus(1);

        expect(mockStorage.deleteSyllabus).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Enrollment Storage Operations', () => {
    const mockEnrollment = {
      id: 1,
      studentId: 'test-user-id-123',
      syllabusId: 1,
      status: 'in-progress' as const,
      currentWeekIndex: 1,
      joinedAt: new Date()
    };

    describe('getEnrollmentsByUserId', () => {
      it('should retrieve enrollments for user', async () => {
        mockStorage.getEnrollmentsByUserId.mockResolvedValue([mockEnrollment]);

        const result = await mockStorage.getEnrollmentsByUserId('test-user-id-123');

        expect(mockStorage.getEnrollmentsByUserId).toHaveBeenCalledWith('test-user-id-123');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockEnrollment);
      });

      it('should return empty array when no enrollments exist', async () => {
        mockStorage.getEnrollmentsByUserId.mockResolvedValue([]);

        const result = await mockStorage.getEnrollmentsByUserId('test-user-id-123');

        expect(result).toEqual([]);
      });
    });

    describe('createEnrollment', () => {
      it('should create new enrollment', async () => {
        const newEnrollment = {
          studentId: 'test-user-id-123',
          syllabusId: 1
        };

        mockStorage.createEnrollment.mockResolvedValue({ id: 1, ...newEnrollment });

        const result = await mockStorage.createEnrollment(newEnrollment);

        expect(mockStorage.createEnrollment).toHaveBeenCalledWith(newEnrollment);
        expect(result.id).toBeDefined();
      });

      it('should handle duplicate enrollment', async () => {
        const duplicateError = new Error('Already enrolled');
        mockStorage.createEnrollment.mockRejectedValue(duplicateError);

        await expect(mockStorage.createEnrollment({ studentId: 'test-user-id-123', syllabusId: 1 }))
          .rejects.toThrow('Already enrolled');
      });
    });
  });

  describe('Step Completion Operations', () => {
    describe('getCompletedSteps', () => {
      it('should retrieve completed steps for enrollment', async () => {
        const completedSteps = [1, 2, 3];
        mockStorage.getCompletedSteps.mockResolvedValue(completedSteps);

        const result = await mockStorage.getCompletedSteps(1);

        expect(mockStorage.getCompletedSteps).toHaveBeenCalledWith(1);
        expect(result).toEqual(completedSteps);
      });
    });

    describe('markStepComplete', () => {
      it('should mark step as complete', async () => {
        mockStorage.markStepComplete.mockResolvedValue(undefined);

        await mockStorage.markStepComplete(1, 5);

        expect(mockStorage.markStepComplete).toHaveBeenCalledWith(1, 5);
      });
    });

    describe('markStepIncomplete', () => {
      it('should mark step as incomplete', async () => {
        mockStorage.markStepIncomplete.mockResolvedValue(undefined);

        await mockStorage.markStepIncomplete(1, 5);

        expect(mockStorage.markStepIncomplete).toHaveBeenCalledWith(1, 5);
      });
    });
  });

  describe('Submission Operations', () => {
    const mockSubmission = {
      id: 1,
      enrollmentId: 1,
      stepId: 5,
      answer: 'Test answer',
      isShared: true,
      submittedAt: new Date()
    };

    describe('getSubmissionsByEnrollmentId', () => {
      it('should retrieve submissions for enrollment', async () => {
        mockStorage.getSubmissionsByEnrollmentId.mockResolvedValue([mockSubmission]);

        const result = await mockStorage.getSubmissionsByEnrollmentId(1);

        expect(mockStorage.getSubmissionsByEnrollmentId).toHaveBeenCalledWith(1);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockSubmission);
      });
    });

    describe('createSubmission', () => {
      it('should create new submission', async () => {
        const newSubmission = {
          enrollmentId: 1,
          stepId: 5,
          answer: 'New answer',
          isShared: false
        };

        mockStorage.createSubmission.mockResolvedValue({ id: 1, ...newSubmission });

        const result = await mockStorage.createSubmission(newSubmission);

        expect(mockStorage.createSubmission).toHaveBeenCalledWith(newSubmission);
        expect(result.id).toBeDefined();
      });
    });

    describe('updateSubmission', () => {
      it('should update submission with feedback', async () => {
        const updateData = {
          feedback: 'Great work!',
          grade: 'A'
        };

        mockStorage.updateSubmission.mockResolvedValue(undefined);

        await mockStorage.updateSubmission(1, updateData);

        expect(mockStorage.updateSubmission).toHaveBeenCalledWith(1, updateData);
      });
    });
  });
});
