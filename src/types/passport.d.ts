import { UserAttributes } from '@/models/user';

declare module 'passport' {
  namespace Express {
    interface User extends UserAttributes {}
  }
}
