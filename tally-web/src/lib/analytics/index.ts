// Re-export all analytics functions
export {
  initPostHog,
  identifyUser,
  resetUser,
  trackSignUp,
  trackSignIn,
  trackSignOut,
  trackChallengeCreated,
  trackEntryLogged,
  trackChallengeCompleted,
  trackDataExported,
  trackDataImported,
  trackPageView,
  trackFeatureUsed,
} from './posthog';

// Analytics event taxonomy documentation
// See plans/observability/feature-observability.md for full schema
export const ANALYTICS_EVENTS = {
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  CHALLENGE_CREATED: 'challenge_created',
  ENTRY_LOGGED: 'entry_logged',
  CHALLENGE_COMPLETED: 'challenge_completed',
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',
  FEATURE_USED: 'feature_used',
} as const;
