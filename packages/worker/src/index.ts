import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { agentHandler } from './agent';
import { toolHandler } from './tools';
import { ttsHandler } from './tts';
import { x402Middleware } from './x402/middleware';

export interface Env {
  GEMINI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  MERCHANT_WALLET: string;
  JUPITER_API_KEY?: string;
  JUPITER_BASE_URL?: string;
  CONFIG: KVNamespace;
  SESSIONS: DurableObjectNamespace;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://voxsol.vercel.app'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Payment', 'X-Payment-Required'],
    exposeHeaders: ['X-Payment-Required', 'X-Payment-Response'],
  })
);

app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

app.post('/agent', agentHandler);

app.post('/tools/:toolName', x402Middleware, toolHandler);

app.post('/tts', ttsHandler);

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;

export { SessionDO } from './session';
