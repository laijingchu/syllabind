import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockUser, mockCreator } from './setup/mocks';

// Import and apply mocks
import './setup/mocks';

describe('Syllabus Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Mock syllabus routes
    app.get('/api/syllabi', async (req, res) => {
      try {
        const syllabi = await mockStorage.getAllSyllabi();
        res.json(syllabi);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch syllabi' });
      }
    });

    app.get('/api/syllabi/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const syllabus = await mockStorage.getSyllabusById(id);

        if (!syllabus) {
          return res.status(404).json({ message: 'Syllabus not found' });
        }

        res.json(syllabus);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch syllabus' });
      }
    });

    app.post('/api/syllabi', async (req, res) => {
      try {
        // Mock auth check
        if (!req.user) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        const syllabusData = req.body;
        const syllabus = await mockStorage.createSyllabus(syllabusData);

        res.status(201).json(syllabus);
      } catch (error) {
        res.status(500).json({ message: 'Failed to create syllabus' });
      }
    });

    app.put('/api/syllabi/:id', async (req, res) => {
      try {
        // Mock auth check
        if (!req.user) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        const id = parseInt(req.params.id);
        const syllabus = await mockStorage.getSyllabusById(id);

        if (!syllabus) {
          return res.status(404).json({ message: 'Syllabus not found' });
        }

        // Check if user is the creator
        if (syllabus.creatorId !== req.user.username) {
          return res.status(403).json({ message: 'Forbidden' });
        }

        await mockStorage.updateSyllabus(id, req.body);

        res.json({ message: 'Syllabus updated' });
      } catch (error) {
        res.status(500).json({ message: 'Failed to update syllabus' });
      }
    });

    app.get('/api/syllabi/:id/learners', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const learners = await mockStorage.getLearnersBySyllabusId(id);

        res.json(learners);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch learners' });
      }
    });
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET /api/syllabi', () => {
    it('should return all syllabi', async () => {
      const mockSyllabi = [
        {
          id: 1,
          title: 'Test Syllabus 1',
          description: 'Description 1',
          audienceLevel: 'Beginner',
          durationWeeks: 4,
          status: 'published',
          creatorId: 'testcreator'
        },
        {
          id: 2,
          title: 'Test Syllabus 2',
          description: 'Description 2',
          audienceLevel: 'Intermediate',
          durationWeeks: 2,
          status: 'published',
          creatorId: 'testcreator'
        }
      ];

      mockStorage.getAllSyllabi.mockResolvedValue(mockSyllabi);

      const response = await request(app)
        .get('/api/syllabi')
        .expect(200);

      expect(mockStorage.getAllSyllabi).toHaveBeenCalled();
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toEqual('Test Syllabus 1');
    });

    it('should return empty array when no syllabi exist', async () => {
      mockStorage.getAllSyllabi.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/syllabi')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/syllabi/:id', () => {
    it('should return syllabus by ID', async () => {
      const mockSyllabus = {
        id: 1,
        title: 'Test Syllabus',
        description: 'Test description',
        audienceLevel: 'Beginner',
        durationWeeks: 4,
        status: 'published',
        creatorId: 'testcreator',
        weeks: [
          {
            id: 1,
            syllabusId: 1,
            index: 1,
            title: 'Week 1',
            steps: []
          }
        ]
      };

      mockStorage.getSyllabusById.mockResolvedValue(mockSyllabus);

      const response = await request(app)
        .get('/api/syllabi/1')
        .expect(200);

      expect(mockStorage.getSyllabusById).toHaveBeenCalledWith(1);
      expect(response.body.title).toEqual('Test Syllabus');
      expect(response.body.weeks).toHaveLength(1);
    });

    it('should return 404 when syllabus not found', async () => {
      mockStorage.getSyllabusById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/syllabi/999')
        .expect(404);

      expect(response.body.message).toEqual('Syllabus not found');
    });
  });

  describe('POST /api/syllabi', () => {
    it('should create new syllabus when authenticated as creator', async () => {
      const newSyllabus = {
        title: 'New Syllabus',
        description: 'New description',
        audienceLevel: 'Intermediate',
        durationWeeks: 3,
        status: 'draft',
        creatorId: 'testcreator'
      };

      // Mock authenticated request
      const authenticatedApp = express();
      authenticatedApp.use(express.json());
      authenticatedApp.use((req, res, next) => {
        req.user = mockCreator;
        next();
      });

      authenticatedApp.post('/api/syllabi', async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }

          const syllabusData = req.body;
          const syllabus = await mockStorage.createSyllabus(syllabusData);

          res.status(201).json(syllabus);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create syllabus' });
        }
      });

      mockStorage.createSyllabus.mockResolvedValue({ id: 1, ...newSyllabus });

      const response = await request(authenticatedApp)
        .post('/api/syllabi')
        .send(newSyllabus)
        .expect(201);

      expect(mockStorage.createSyllabus).toHaveBeenCalledWith(newSyllabus);
      expect(response.body.title).toEqual('New Syllabus');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/syllabi')
        .send({
          title: 'New Syllabus',
          description: 'Description'
        })
        .expect(401);

      expect(response.body.message).toEqual('Unauthorized');
    });
  });

  describe('PUT /api/syllabi/:id', () => {
    it('should update syllabus when user is creator', async () => {
      const existingSyllabus = {
        id: 1,
        title: 'Original Title',
        description: 'Original description',
        audienceLevel: 'Beginner',
        durationWeeks: 4,
        status: 'draft',
        creatorId: 'testcreator'
      };

      // Mock authenticated request as creator
      const authenticatedApp = express();
      authenticatedApp.use(express.json());
      authenticatedApp.use((req, res, next) => {
        req.user = mockCreator;
        next();
      });

      authenticatedApp.put('/api/syllabi/:id', async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }

          const id = parseInt(req.params.id);
          const syllabus = await mockStorage.getSyllabusById(id);

          if (!syllabus) {
            return res.status(404).json({ message: 'Syllabus not found' });
          }

          if (syllabus.creatorId !== req.user.username) {
            return res.status(403).json({ message: 'Forbidden' });
          }

          await mockStorage.updateSyllabus(id, req.body);

          res.json({ message: 'Syllabus updated' });
        } catch (error) {
          res.status(500).json({ message: 'Failed to update syllabus' });
        }
      });

      mockStorage.getSyllabusById.mockResolvedValue(existingSyllabus);
      mockStorage.updateSyllabus.mockResolvedValue(undefined);

      const response = await request(authenticatedApp)
        .put('/api/syllabi/1')
        .send({
          title: 'Updated Title',
          status: 'published'
        })
        .expect(200);

      expect(mockStorage.updateSyllabus).toHaveBeenCalledWith(1, {
        title: 'Updated Title',
        status: 'published'
      });
      expect(response.body.message).toEqual('Syllabus updated');
    });

    it('should return 403 when user is not the creator', async () => {
      const existingSyllabus = {
        id: 1,
        title: 'Original Title',
        creatorId: 'othercreator'
      };

      const authenticatedApp = express();
      authenticatedApp.use(express.json());
      authenticatedApp.use((req, res, next) => {
        req.user = mockCreator; // testcreator trying to edit othercreator's syllabus
        next();
      });

      authenticatedApp.put('/api/syllabi/:id', async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }

          const id = parseInt(req.params.id);
          const syllabus = await mockStorage.getSyllabusById(id);

          if (!syllabus) {
            return res.status(404).json({ message: 'Syllabus not found' });
          }

          if (syllabus.creatorId !== req.user.username) {
            return res.status(403).json({ message: 'Forbidden' });
          }

          await mockStorage.updateSyllabus(id, req.body);

          res.json({ message: 'Syllabus updated' });
        } catch (error) {
          res.status(500).json({ message: 'Failed to update syllabus' });
        }
      });

      mockStorage.getSyllabusById.mockResolvedValue(existingSyllabus);

      const response = await request(authenticatedApp)
        .put('/api/syllabi/1')
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.message).toEqual('Forbidden');
    });
  });

  describe('GET /api/syllabi/:id/learners', () => {
    it('should return learners for a syllabus', async () => {
      const mockLearners = [
        {
          user: mockUser,
          status: 'in-progress',
          joinedDate: '2026-01-01'
        }
      ];

      mockStorage.getLearnersBySyllabusId.mockResolvedValue(mockLearners);

      const response = await request(app)
        .get('/api/syllabi/1/learners')
        .expect(200);

      expect(mockStorage.getLearnersBySyllabusId).toHaveBeenCalledWith(1);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].user.email).toEqual(mockUser.email);
    });

    it('should return empty array when no learners enrolled', async () => {
      mockStorage.getLearnersBySyllabusId.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/syllabi/1/learners')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
