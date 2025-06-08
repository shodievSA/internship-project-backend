import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';


const PgSession = connectPgSimple(session);

const pgPool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

const sessionMiddleware = session({
  store: new PgSession({
    pool: pgPool,
    tableName: 'sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 1 * 60 * 60 * 1000, // 1 hour cleanup interval
  }),

  secret: process.env.SESSION_SECRET || 'some-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

export default sessionMiddleware;