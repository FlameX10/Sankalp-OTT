import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware.js';
import contentRouter from './modules/content/content.router.js';
import feedRouter from './modules/content/feed.router.js';
import mediaRouter from './modules/media/media.router.js';

const app = express();

// ── Global middleware ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      workerSrc:  ["'self'", "blob:"],
      mediaSrc: ["'self'", "blob:", "http://localhost:9000", "http://127.0.0.1:9000"],
      connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*","https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:9000"],
    },
  },
}));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081', 'http://localhost:19006'],
  credentials: true,
}));
// Configure body parsers with higher limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Serve web reels player
app.use('/player', express.static('public'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Routes ──
// app.use('/api/auth', authRouter);
// app.use('/api/users', usersRouter);
app.use('/api/content', contentRouter);
app.use('/api/feed', feedRouter);
// app.use('/api/home', homeRouter);
// app.use('/api/coins', coinsRouter);
// app.use('/api/payments', paymentsRouter);
app.use('/api/media', mediaRouter);
// app.use('/api/notifications', notificationsRouter);
// app.use('/api/search', searchRouter);
// app.use('/api/banners', bannersRouter);
// app.use('/api/playlists', playlistsRouter);
// app.use('/api/ratings', ratingsRouter);
// app.use('/api/admin', adminRouter);

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler (must be last) ──
app.use(errorHandler);

export default app;
