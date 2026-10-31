import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Express middleware that checks req.body against a Zod schema.
 * Bad data: responds 400 with a list of problems and stops.
 * Good data: replaces req.body with the cleaned data and moves on to the route.
 */
export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (result.success === false) {
      res.status(400).json({
        error: 'Validation failed',
        issues: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
