import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { SERVER } from './constants.js';
import { ocean } from './ocean/route.js';

// The app: a collection of routes. It knows nothing about Node or any host.
const app = new Hono();

// A route = HTTP method + path + handler. `c` is the Context: it holds the
// incoming request (c.req) and has helpers to build the response (c.json, ...).
app.get('/api/health', (c) => {
  return c.json({ ok: true });
});

// app.route(prefix, subApp) mounts another Hono app under a path prefix,
// so the sub-app's '/' route answers at /api/ocean.
app.route('/api/ocean', ocean);

// The adapter connects the host-agnostic app to Node's HTTP server.
// app.fetch is a standard (Request) => Response function.
serve({ fetch: app.fetch, port: SERVER.port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});
