declare module 'passport-google-oauth20' {
  import { Strategy as PassportStrategy } from 'passport-strategy';

  export class Strategy extends PassportStrategy {
    constructor(options: any, verify: any);
  }
}
