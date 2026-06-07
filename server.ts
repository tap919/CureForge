import express from 'express';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { METADATA } from './server/metadata';
import targetRoutes from './server/routes/targets';
import verifyRoutes from './server/routes/verify';
import synthesizeRoutes from './server/routes/synthesize';
import daemonRoutes from './server/routes/daemon';
import bayesRoutes from './server/routes/bayes';
import ingestRoutes from './server/routes/ingest';
import retrospectiveRoutes from './server/routes/retrospective';
import { seedDatabase } from './server/db';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

// Main general rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);

// Register routes
app.get('/api/config', (_req, res) => {
  res.json(METADATA);
});

app.use('/api/targets', targetRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/synthesize', synthesizeRoutes);
app.use('/api/daemon', daemonRoutes);
app.use('/api/bayes', bayesRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/retrospective', retrospectiveRoutes);

async function startServer() {
  // Run startup tasks
  try {
    await seedDatabase();
    console.log('Database seeded successfully.');
  } catch (err) {
    console.error('Failed to seed database:', err);
  }

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(3000, '0.0.0.0', () => {
    const caps = METADATA.majorCapabilities.length
      ? METADATA.majorCapabilities.join(', ')
      : 'none';
    console.log(`CureForge server running on port 3000 – Capabilities: ${caps}`);
  });
}

if (!process.env.VITEST) {
  startServer();
}

export { app };