import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockCreator } from './setup/mocks';

describe('Chat Messages Routes', () => {
  let creatorApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // GET /api/syllabi/:id/chat-messages
    a.get('/api/syllabi/:id/chat-messages', authMiddleware, async (req, res) => {
      const syllabusId = parseInt(req.params.id);
      const username = (req.user as any).username;
      const syllabus = await mockStorage.getSyllabus(syllabusId);
      if (!syllabus || syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      const messages = await mockStorage.getChatMessages(syllabusId);
      res.json(messages);
    });

    // POST /api/syllabi/:id/chat-messages
    a.post('/api/syllabi/:id/chat-messages', authMiddleware, async (req, res) => {
      const syllabusId = parseInt(req.params.id);
      const username = (req.user as any).username;
      const { role, content } = req.body;
      const syllabus = await mockStorage.getSyllabus(syllabusId);
      if (!syllabus || syllabus.creatorId !== username) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      const message = await mockStorage.createChatMessage({ syllabusId, role, content });
      res.json(message);
    });
  }

  beforeAll(() => {
    creatorApp = express();
    creatorApp.use(express.json());
    creatorApp.use((req, _res, next) => { req.user = mockCreator; next(); });
    registerRoutes(creatorApp);
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET /api/syllabi/:id/chat-messages', () => {
    it('should return chat messages for creator', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'testcreator' });
      const messages = [
        { id: 1, syllabusId: 1, role: 'user', content: 'Hello' },
        { id: 2, syllabusId: 1, role: 'assistant', content: 'Hi there!' }
      ];
      mockStorage.getChatMessages.mockResolvedValue(messages);

      const res = await request(creatorApp).get('/api/syllabi/1/chat-messages').expect(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].role).toBe('user');
    });

    it('should return 403 when not creator/owner', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'othercreator' });
      await request(creatorApp).get('/api/syllabi/1/chat-messages').expect(403);
    });

    it('should return 403 when syllabus not found', async () => {
      mockStorage.getSyllabus.mockResolvedValue(null);
      await request(creatorApp).get('/api/syllabi/999/chat-messages').expect(403);
    });
  });

  describe('POST /api/syllabi/:id/chat-messages', () => {
    it('should save a chat message', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'testcreator' });
      mockStorage.createChatMessage.mockResolvedValue({
        id: 3, syllabusId: 1, role: 'user', content: 'Add more readings'
      });

      const res = await request(creatorApp)
        .post('/api/syllabi/1/chat-messages')
        .send({ role: 'user', content: 'Add more readings' })
        .expect(200);

      expect(mockStorage.createChatMessage).toHaveBeenCalledWith({
        syllabusId: 1,
        role: 'user',
        content: 'Add more readings'
      });
      expect(res.body.content).toBe('Add more readings');
    });

    it('should return 403 when not creator/owner', async () => {
      mockStorage.getSyllabus.mockResolvedValue({ id: 1, creatorId: 'othercreator' });

      await request(creatorApp)
        .post('/api/syllabi/1/chat-messages')
        .send({ role: 'user', content: 'test' })
        .expect(403);
    });
  });
});
