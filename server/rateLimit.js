/**
 * server/rateLimit.js
 * ------------------------------------------------------------------
 * Uses `express-rate-limit` (open source, MIT) instead of writing
 * request-counting logic by hand - it already handles the fiddly
 * parts correctly (sliding windows, per-key counters, cleanup) that
 * are easy to get subtly wrong in a hand-rolled version.
 *
 * This limits requests per IP address within a time window - a
 * different, complementary protection from the per-ACCOUNT 2-device
 * cap in AuthContext.jsx (that one limits how many devices one
 * account can be logged into at once; this one limits how many
 * requests any single network address can fire at the API,
 * regardless of whether they're logged in at all).
 */

import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,               // 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "We're limiting requests right now to keep Codetrove fast and fair for everyone. Please try again in a few minutes.",
  },
});
