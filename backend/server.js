import app from './app.js';
import config from './config/index.js';
import { prisma } from './prisma/client.js';

async function start() {
  // Test database connection
  try {
    await prisma.$connect();
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Make sure Docker is running: cd docker && docker compose -f docker-compose.dev.yml up -d');
    process.exit(1);
  }

  // Start HTTP server with extended timeouts for file uploads
  const server = app.listen(config.port, () => {
    console.log(`\nOTT API running on http://localhost:${config.port}/api`);
    console.log(`Health check: http://localhost:${config.port}/api/health`);
    console.log(`Environment: ${config.nodeEnv}\n`);
  });

  // Set extended timeouts for large file uploads (30 minutes)
  server.requestTimeout = 30 * 60 * 1000; // 30 minutes
  server.timeout = 30 * 60 * 1000; // 30 minutes for total request
  server.keepAliveTimeout = 65 * 1000; // 65 seconds for keep-alive
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
