// Sentry v11 replaced `sendDefaultPii` with `dataCollection`, whose defaults
// collect more. This keeps the v10 `sendDefaultPii: false` behaviour.
const DENY_IDENTIFYING_KEYS = { deny: ["forwarded", "-ip", "remote-", "via", "-user"] };

export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: DENY_IDENTIFYING_KEYS, response: DENY_IDENTIFYING_KEYS },
  httpBodies: [],
  urlQueryParams: DENY_IDENTIFYING_KEYS,
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
};
