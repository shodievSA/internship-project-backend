import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Request } from 'express';
import { models } from '../models';
import crypto from 'crypto';
import { Profile } from 'passport';
import { UserData } from '@/types';
import { UserAttributes } from '@/models/user';

interface GoogleStrategyParams {
  expires_in?: number;
}
const url = process.env.BASE_URL;

const encryptToken = (token: string): string => {
  const ENCRYPTION_KEY = crypto
    .createHash('sha256')
    .update(process.env.ENCRYPTION_KEY!)
    .digest();

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
};

export const decryptToken = (encryptedToken: string): string => {
  const ENCRYPTION_KEY = crypto
    .createHash('sha256')
    .update(process.env.ENCRYPTION_KEY!)
    .digest();

  const iv = Buffer.from(encryptedToken.slice(0, 32), 'hex');
  const encrypted = encryptedToken.slice(32);

  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

passport.serializeUser(
  (user: UserAttributes, done: (err: any, id?: number) => void) => {
    done(null, user.id);
  }
);

passport.deserializeUser(
  async (
    id: number,
    done: (err: any, user?: UserAttributes | false) => void
  ) => {
    try {
      const user = await models.User.findByPk(id, {
        attributes: [
          'id',
          'googleId',
          'email',
          'fullName',
          'avatarUrl',
          'createdAt',
          'lastLoginAt',
        ],
      });

      if (!user) return done(null, false);

      const plainUser = user.get({ plain: true }) as UserAttributes;
      done(null, plainUser);
    } catch (err) {
      done(err);
    }
  }
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${url}/api/v1/auth/google/callback`,
      passReqToCallback: true,
    },
    async (
      req: Request,
      accessToken: string,
      refreshToken: string | undefined,
      params: GoogleStrategyParams,
      profile: Profile,
      done: any
    ) => {
      try {
        if (!profile.id) throw new Error('Invalid profile: missing Google ID');
        if (!accessToken)
          throw new Error('No access token received from Google');

        const expiresIn = params.expires_in || 3600;
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

        const encryptedAccessToken = encryptToken(accessToken);
        const encryptedRefreshToken = refreshToken
          ? encryptToken(refreshToken)
          : null;

        const [user, created] = await models.User.findOrCreate({
          where: { googleId: profile.id },
          defaults: {
            googleId: profile.id,
            email: profile.emails?.[0]?.value!,
            fullName: profile.displayName || 'Unknown User',
            avatarUrl: profile.photos?.[0]?.value,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken || undefined,
            tokenExpiresAt,
            lastLoginAt: new Date(),
          },
        });

        if (!created) {
          await user.update({
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken ?? null,
            tokenExpiresAt,
            lastLoginAt: new Date(),
          });
        }
        const plainUser = user.get({ plain: true });
        console.log(plainUser);
        return done(null, plainUser);
      } catch (err) {
        const error = err as Error;
        console.error({
          error: error.message,
          stack: error.stack,
          profileId: profile?.id,
          timestamp: new Date().toISOString(),
        });

        return done(new Error('Authentication failed. Please try again.'));
      }
    }
  ) as unknown as passport.Strategy
);
(GoogleStrategy.prototype as any).authorizationParams = function () {
  return {
    access_type: 'offline',
    prompt: 'consent',
  };
};
