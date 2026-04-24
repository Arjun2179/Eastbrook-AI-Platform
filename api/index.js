// Vercel serverless entry point — imports the Express app and exports it as
// the default handler. Vercel's @vercel/node runtime wraps it automatically.
import app from '../server/index.js';

export default app;
