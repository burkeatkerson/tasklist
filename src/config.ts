// How long a completed task stays before it is permanently removed.
export const COMPLETED_TTL_HOURS = 24;
export const COMPLETED_TTL_MS = COMPLETED_TTL_HOURS * 60 * 60 * 1000;

// How often the client sweeps the database for expired completed tasks.
export const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
