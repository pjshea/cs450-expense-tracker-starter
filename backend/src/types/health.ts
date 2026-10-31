/**
 * Shape of the JSON returned by GET /api/health.
 * If a field is removed, renamed or given the wrong type,
 * `tsc` fails at compile time instead of the frontend breaking at runtime.
 */
export interface HealthResponse {
  status: 'ok';
  app: string;
  uptimeSeconds: number;
  timestamp: string;
}

export function buildHealthResponse(): HealthResponse {
  return {
    status: 'ok',
    app: 'expense-tracker-backend',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  };
}
