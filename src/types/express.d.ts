import User from '@/models/user';

declare global {
  namespace Express {
    interface User extends UserAttributes {}
    interface Request {
      user?: User;
    }
  }
}
