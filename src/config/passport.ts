import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Profile } from "passport";
import { Request } from "express";
import crypto from 'crypto';

import {models} from "../models";
import User from "../models/user";


const url = process.env.BASE_URL || 'http://localhost:3000';

const encryptToken = (token: string): string => {
    const ENCRYPTION_KEY = crypto
        .createHash('sha256')
        .update(process.env.ENCRYPTION_KEY!)
        .digest();

    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const encryptedWithIV = iv.toString('hex') + encrypted;
    return encryptedWithIV;
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

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    try {
        const user = await models.User.findByPk(id);

        if (!user) {
            return done(null, false);
        }

        done(null, user);
    } catch (err) {
        done(err);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${url}/auth/google/callback`,
    passReqToCallback: true,
}, async (req: Request, accessToken: string, refreshToken: string, params: any, profile: Profile, done: any) => {
    try {
        if (!profile.id) throw new Error('Invalid profile: missing Google ID');
        if (!accessToken) throw new Error('No access token received from Google');

        const expiresIn = params.expires_in || 3600;
        const tokenExpiresAt = new Date(Date.now() + expiresIn* 1000);

        const encryptedAccessToken = encryptToken(accessToken);
        const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;

        const [ user, created ] = await models.User.findOrCreate(
            {where: { googleId: profile.id },
            defaults: {
                googleId: profile.id,
                email: profile.emails?.[0]?.value,
                fullName: profile.displayName || 'Unknown User',
                avatarUrl: profile.photos?.[0]?.value,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
								tokenExpiresAt,
                lastLoginAt: new Date()
            }
        });

        if (!created) {
            await user.update({accessToken: encryptedAccessToken,
                               refreshToken: encryptedRefreshToken,
                               tokenExpiresAt, lastLoginAt: new Date()});
        }

        return done(null, user);
    } catch (err) {
        const error = err as Error;

        console.error({
            error: error.message,
            stack: error.stack,
            profileId: profile?.id,
            timestamp: new Date().toISOString()
        });

        return done(new Error('Authentication failed. Please try again.'));
    }
}) as unknown as passport.Strategy);

(GoogleStrategy.prototype as any).authorizationParams = function () {
  return {
    access_type: 'offline',
    prompt: 'consent',
  };
};