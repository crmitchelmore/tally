"use client";

import { useEffect } from "react";

/**
 * Client component that initializes debug bridge in development.
 * Add to layout to enable AI-powered browser automation.
 */
export function DebugBridgeInit() {
  useEffect(() => {
    // Only initialize in development with session param
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (!params.get('session')) {
      return;
    }

    // Dynamic import to avoid bundling
    import('@/lib/debug-bridge').then(({ initDebugBridge }) => {
      initDebugBridge();
    }).catch(() => {
      // debug-bridge-browser not installed, silently ignore
    });
  }, []);

  return null;
}
