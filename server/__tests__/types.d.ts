import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      login?: (user: any, callback: () => void) => void;
      logout?: (callback: () => void) => void;
      isAuthenticated?: () => boolean;
    }
  }
}
