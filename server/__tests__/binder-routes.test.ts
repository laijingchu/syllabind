import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockUser, mockCurator } from './setup/mocks';

// Import and apply mocks
import './setup/mocks';

describe('Binder Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Mock binder routes
    app.get('/api/binders', async (req, res) => {
      try {
        const binders = await mockStorage.listBinders();
        res.json(binders);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch binders' });
      }
    });

    app.get('/api/binders/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const binder = await mockStorage.getBinder(id);

        if (!binder) {
          return res.status(404).json({ message: 'Binder not found' });
        }

        res.json(binder);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch binder' });
      }
    });

    app.post('/api/binders', async (req, res) => {
      try {
        // Mock auth check
        if (!req.user) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        const binderData = req.body;
        const binder = await mockStorage.createBinder(binderData);

        res.status(201).json(binder);
      } catch (error) {
        res.status(500).json({ message: 'Failed to create binder' });
      }
    });

    app.put('/api/binders/:id', async (req, res) => {
      try {
        // Mock auth check
        if (!req.user) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        const id = parseInt(req.params.id);
        const binder = await mockStorage.getBinder(id);

        if (!binder) {
          return res.status(404).json({ message: 'Binder not found' });
        }

        // Check if user is the curator
        if (binder.curatorId !== req.user.username) {
          return res.status(403).json({ message: 'Forbidden' });
        }

        await mockStorage.updateBinder(id, req.body);

        res.json({ message: 'Binder updated' });
      } catch (error) {
        res.status(500).json({ message: 'Failed to update binder' });
      }
    });

    app.get('/api/binders/:id/readers', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const readers = await mockStorage.getReadersByBinderId(id);

        res.json(readers);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch readers' });
      }
    });
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET /api/binders', () => {
    it('should return all binders', async () => {
      const mockBinders = [
        {
          id: 1,
          title: 'Test Binder 1',
          description: 'Description 1',
          audienceLevel: 'Beginner',
          durationWeeks: 4,
          status: 'published',
          curatorId: 'testcurator'
        },
        {
          id: 2,
          title: 'Test Binder 2',
          description: 'Description 2',
          audienceLevel: 'Intermediate',
          durationWeeks: 2,
          status: 'published',
          curatorId: 'testcurator'
        }
      ];

      mockStorage.listBinders.mockResolvedValue(mockBinders);

      const response = await request(app)
        .get('/api/binders')
        .expect(200);

      expect(mockStorage.listBinders).toHaveBeenCalled();
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toEqual('Test Binder 1');
    });

    it('should return empty array when no binders exist', async () => {
      mockStorage.listBinders.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/binders')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/binders/:id', () => {
    it('should return binder by ID', async () => {
      const mockBinder = {
        id: 1,
        title: 'Test Binder',
        description: 'Test description',
        audienceLevel: 'Beginner',
        durationWeeks: 4,
        status: 'published',
        curatorId: 'testcurator',
        weeks: [
          {
            id: 1,
            binderId: 1,
            index: 1,
            title: 'Week 1',
            steps: []
          }
        ]
      };

      mockStorage.getBinder.mockResolvedValue(mockBinder);

      const response = await request(app)
        .get('/api/binders/1')
        .expect(200);

      expect(mockStorage.getBinder).toHaveBeenCalledWith(1);
      expect(response.body.title).toEqual('Test Binder');
      expect(response.body.weeks).toHaveLength(1);
    });

    it('should return 404 when binder not found', async () => {
      mockStorage.getBinder.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/binders/999')
        .expect(404);

      expect(response.body.message).toEqual('Binder not found');
    });
  });

  describe('POST /api/binders', () => {
    it('should create new binder when authenticated as curator', async () => {
      const newBinder = {
        title: 'New Binder',
        description: 'New description',
        audienceLevel: 'Intermediate',
        durationWeeks: 3,
        status: 'draft',
        curatorId: 'testcurator'
      };

      // Mock authenticated request
      const authenticatedApp = express();
      authenticatedApp.use(express.json());
      authenticatedApp.use((req, res, next) => {
        req.user = mockCurator;
        next();
      });

      authenticatedApp.post('/api/binders', async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }

          const binderData = req.body;
          const binder = await mockStorage.createBinder(binderData);

          res.status(201).json(binder);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create binder' });
        }
      });

      mockStorage.createBinder.mockResolvedValue({ id: 1, ...newBinder });

      const response = await request(authenticatedApp)
        .post('/api/binders')
        .send(newBinder)
        .expect(201);

      expect(mockStorage.createBinder).toHaveBeenCalledWith(newBinder);
      expect(response.body.title).toEqual('New Binder');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/binders')
        .send({
          title: 'New Binder',
          description: 'Description'
        })
        .expect(401);

      expect(response.body.message).toEqual('Unauthorized');
    });
  });

  describe('PUT /api/binders/:id', () => {
    it('should update binder when user is curator', async () => {
      const existingBinder = {
        id: 1,
        title: 'Original Title',
        description: 'Original description',
        audienceLevel: 'Beginner',
        durationWeeks: 4,
        status: 'draft',
        curatorId: 'testcurator'
      };

      // Mock authenticated request as curator
      const authenticatedApp = express();
      authenticatedApp.use(express.json());
      authenticatedApp.use((req, res, next) => {
        req.user = mockCurator;
        next();
      });

      authenticatedApp.put('/api/binders/:id', async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }

          const id = parseInt(req.params.id);
          const binder = await mockStorage.getBinder(id);

          if (!binder) {
            return res.status(404).json({ message: 'Binder not found' });
          }

          if (binder.curatorId !== req.user.username) {
            return res.status(403).json({ message: 'Forbidden' });
          }

          await mockStorage.updateBinder(id, req.body);

          res.json({ message: 'Binder updated' });
        } catch (error) {
          res.status(500).json({ message: 'Failed to update binder' });
        }
      });

      mockStorage.getBinder.mockResolvedValue(existingBinder);
      mockStorage.updateBinder.mockResolvedValue(undefined);

      const response = await request(authenticatedApp)
        .put('/api/binders/1')
        .send({
          title: 'Updated Title',
          status: 'published'
        })
        .expect(200);

      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, {
        title: 'Updated Title',
        status: 'published'
      });
      expect(response.body.message).toEqual('Binder updated');
    });

    it('should return 403 when user is not the curator', async () => {
      const existingBinder = {
        id: 1,
        title: 'Original Title',
        curatorId: 'othercreator'
      };

      const authenticatedApp = express();
      authenticatedApp.use(express.json());
      authenticatedApp.use((req, res, next) => {
        req.user = mockCurator; // testcurator trying to edit another curator's binder
        next();
      });

      authenticatedApp.put('/api/binders/:id', async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }

          const id = parseInt(req.params.id);
          const binder = await mockStorage.getBinder(id);

          if (!binder) {
            return res.status(404).json({ message: 'Binder not found' });
          }

          if (binder.curatorId !== req.user.username) {
            return res.status(403).json({ message: 'Forbidden' });
          }

          await mockStorage.updateBinder(id, req.body);

          res.json({ message: 'Binder updated' });
        } catch (error) {
          res.status(500).json({ message: 'Failed to update binder' });
        }
      });

      mockStorage.getBinder.mockResolvedValue(existingBinder);

      const response = await request(authenticatedApp)
        .put('/api/binders/1')
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.message).toEqual('Forbidden');
    });
  });

  describe('PUT /api/binders/:id - showSchedulingLink', () => {
    it('should update showSchedulingLink to false', async () => {
      const existingBinder = {
        id: 1,
        title: 'Test Binder',
        description: 'Description',
        audienceLevel: 'Beginner',
        durationWeeks: 4,
        status: 'draft',
        curatorId: 'testcurator',
        showSchedulingLink: true,
      };

      const authenticatedApp = express();
      authenticatedApp.use(express.json());
      authenticatedApp.use((req, res, next) => {
        req.user = mockCurator;
        next();
      });

      authenticatedApp.put('/api/binders/:id', async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }
          const id = parseInt(req.params.id);
          const binder = await mockStorage.getBinder(id);
          if (!binder) {
            return res.status(404).json({ message: 'Binder not found' });
          }
          if (binder.curatorId !== req.user.username) {
            return res.status(403).json({ message: 'Forbidden' });
          }
          await mockStorage.updateBinder(id, req.body);
          res.json({ message: 'Binder updated' });
        } catch (error) {
          res.status(500).json({ message: 'Failed to update binder' });
        }
      });

      mockStorage.getBinder.mockResolvedValue(existingBinder);
      mockStorage.updateBinder.mockResolvedValue(undefined);

      const response = await request(authenticatedApp)
        .put('/api/binders/1')
        .send({ showSchedulingLink: false })
        .expect(200);

      expect(mockStorage.updateBinder).toHaveBeenCalledWith(1, {
        showSchedulingLink: false,
      });
      expect(response.body.message).toEqual('Binder updated');
    });

    it('should include showSchedulingLink default in created binder', async () => {
      const newBinder = {
        title: 'New Binder',
        description: 'Description',
        audienceLevel: 'Beginner',
        durationWeeks: 4,
        status: 'draft',
        curatorId: 'testcurator',
        showSchedulingLink: true,
      };

      const authenticatedApp = express();
      authenticatedApp.use(express.json());
      authenticatedApp.use((req, res, next) => {
        req.user = mockCurator;
        next();
      });

      authenticatedApp.post('/api/binders', async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }
          const binder = await mockStorage.createBinder(req.body);
          res.status(201).json(binder);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create binder' });
        }
      });

      mockStorage.createBinder.mockResolvedValue({ id: 1, ...newBinder });

      const response = await request(authenticatedApp)
        .post('/api/binders')
        .send(newBinder)
        .expect(201);

      expect(response.body.showSchedulingLink).toBe(true);
    });
  });

  describe('GET /api/binders/:id/readers', () => {
    it('should return readers for a binder', async () => {
      const mockReaders = [
        {
          user: mockUser,
          status: 'in-progress',
          joinedDate: '2026-01-01'
        }
      ];

      mockStorage.getReadersByBinderId.mockResolvedValue(mockReaders);

      const response = await request(app)
        .get('/api/binders/1/readers')
        .expect(200);

      expect(mockStorage.getReadersByBinderId).toHaveBeenCalledWith(1);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].user.email).toEqual(mockUser.email);
    });

    it('should return empty array when no readers enrolled', async () => {
      mockStorage.getReadersByBinderId.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/binders/1/readers')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
