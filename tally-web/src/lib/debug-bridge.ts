/**
 * Debug Bridge integration for AI-powered browser automation and testing.
 * 
 * This enables LLM agents to interact with the Tally app via WebSocket for:
 * - UI inspection and element discovery
 * - Click, type, and form interactions
 * - Screenshots and state inspection
 * - Network and navigation monitoring
 * 
 * Usage:
 * 1. Start debug server: `npx debug-bridge-cli connect --session tally --port 4000`
 * 2. Open app with params: `http://localhost:3000?session=tally&port=4000`
 * 3. Use CLI commands: `ui`, `click`, `type`, `screenshot`, etc.
 * 
 * @see https://github.com/stevengonsalvez/agent-bridge
 */

// Only import in development to avoid bundling in production
let createDebugBridge: typeof import('debug-bridge-browser').createDebugBridge;

/**
 * Initialize debug bridge if running in development with session params.
 * Safe to call in production - will no-op if conditions aren't met.
 */
export async function initDebugBridge(): Promise<void> {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Only run in browser
  if (typeof window === 'undefined') {
    return;
  }

  // Check for debug session params
  const params = new URLSearchParams(window.location.search);
  const session = params.get('session');
  const port = params.get('port') || '4000';

  if (!session) {
    return;
  }

  try {
    // Dynamic import to avoid bundling in production
    const mod = await import('debug-bridge-browser');
    createDebugBridge = mod.createDebugBridge;

    const bridge = createDebugBridge({
      url: `ws://localhost:${port}/debug?role=app&sessionId=${session}`,
      sessionId: session,
      appName: 'Tally',
      appVersion: '1.0.0',

      // Feature toggles
      enableNetwork: true,      // Capture fetch/XHR requests
      enableNavigation: true,   // Track route changes
      enableConsole: true,      // Capture console.log/error
      enableErrors: true,       // Capture unhandled errors
      enableDomSnapshot: true,  // Send DOM snapshots
      enableDomMutations: true, // Track DOM changes
      enableUiTree: true,       // Build interactive element tree

      // Filter out analytics and telemetry from network capture
      networkUrlFilter: (url: string) => {
        return !url.includes('/analytics') && 
               !url.includes('posthog') &&
               !url.includes('honeycomb');
      },
      maxNetworkBodySize: 10000,

      // Custom state provider for Tally-specific data
      getCustomState: () => {
        try {
          // Get relevant localStorage data (not sensitive)
          const offlineChallenges = localStorage.getItem('tally_challenges');
          const dashboardConfig = localStorage.getItem('tally_dashboard_config');
          
          return {
            offline: {
              hasChallenges: !!offlineChallenges,
              challengeCount: offlineChallenges ? JSON.parse(offlineChallenges).length : 0,
            },
            dashboard: dashboardConfig ? JSON.parse(dashboardConfig) : null,
            url: window.location.pathname,
          };
        } catch {
          return {};
        }
      },

      // Use data-testid for stable element identification
      getStableId: (el: Element) => {
        return el.getAttribute('data-testid') || 
               el.getAttribute('aria-label') ||
               null;
      },

      // Callbacks
      onConnect: () => {
        console.log('[DebugBridge] Connected to debug server');
      },
      onDisconnect: () => {
        console.log('[DebugBridge] Disconnected from debug server');
      },
      onError: (err: Error) => {
        console.error('[DebugBridge] Error:', err);
      },
    });

    bridge.connect();

    // Expose for manual debugging
    (window as unknown as { __debugBridge: unknown }).__debugBridge = bridge;

    console.log(`[DebugBridge] Initialized with session=${session}, port=${port}`);
  } catch (err) {
    // Silently fail if debug-bridge-browser isn't installed
    console.debug('[DebugBridge] Not available:', err);
  }
}
