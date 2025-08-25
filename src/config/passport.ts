import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Request } from 'express';
import { models } from '../models';
import { Profile } from 'passport';
import { UserAttributes } from '@/models/user';
import { runCryptoWorker } from '@/utils/cryptoWorkerHelper';

const encryptionKey = process.env.ENCRYPTION_KEY;

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

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.BASE_URL}/api/v1/auth/google/callback`,
    passReqToCallback: true,
}, async (
	_req: Request,
	accessToken: string,
	refreshToken: string,
	_params: any,
	profile: Profile,
	done: any
) => {

    try {

        if (!profile.id) throw new Error('Invalid profile: missing Google ID');
        if (!accessToken) throw new Error('No access token received from Google');

		const encryptedAccessToken = await runCryptoWorker('encrypt', accessToken, encryptionKey!);
        const encryptedRefreshToken = await runCryptoWorker('encrypt', refreshToken, encryptionKey!);

		const user = await models.User.findOne({
			where: { email: profile.emails![0].value }
		});

		if (user) {

			if (user.isInvited) {

				await user.update({
					googleId: profile.id,
					fullName: profile.displayName,
					avatarUrl: profile.photos?.[0]?.value ?? null,
					accessToken: encryptedAccessToken,
					refreshToken: encryptedRefreshToken,
					isInvited: false
				});

			} else {

				await user.update({
					accessToken: encryptedAccessToken,
					refreshToken: encryptedRefreshToken,
				});

			}

			return done(null, user);

		} else {

			const newUser = await models.User.create({
				googleId: profile.id,
				email: profile.emails![0].value,
				fullName: profile.displayName,
				avatarUrl: profile.photos?.[0]?.value ?? null,
				accessToken: encryptedAccessToken,
				refreshToken: encryptedRefreshToken,
				isInvited: false
			});

			return done(null, newUser);

		}

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

}) as passport.Strategy);

(GoogleStrategy.prototype as any).authorizationParams = function () {

	return {
		access_type: 'offline',
		prompt: 'consent'
	}

};
