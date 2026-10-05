import { createMiddleware } from 'hono/factory';

// Middleware = a function that wraps a route handler. `next()` runs the rest of
// the chain (later middleware, then the handler); code after it sees the response.
// Used for cross-cutting concerns like this header, not for business logic.
export const cacheControl = (maxAgeSec: number) =>
  createMiddleware(async (c, next) => {
    await next();
    // Only successful responses are cacheable; never let a 400/502 stick.
    if (c.res.status === 200) {
      c.header('Cache-Control', `public, max-age=${maxAgeSec}`);
    }
  });
