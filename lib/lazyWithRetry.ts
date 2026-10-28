import React from 'react';

/**
 * Enhanced lazy import with automatic retry and chunk-mismatch recovery.
 * Handles transient network glitches, Vite dev-server on-demand compilation delays,
 * and post-deploy stale chunk hash mismatches.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  componentName = 'Module',
  maxRetries = 2,
  baseDelay = 600
): React.LazyExoticComponent<T> {
  return React.lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempts = 0;

      const executeImport = () => {
        attempts++;
        factory()
          .then((module) => {
            // Clear any previous reload flag once successful
            try {
              sessionStorage.removeItem(`retry_reload_${componentName}`);
            } catch {
              // ignore storage errors
            }
            resolve(module);
          })
          .catch((error) => {
            console.warn(
              `[lazyWithRetry] Failed to load "${componentName}" (attempt ${attempts}/${maxRetries + 1}):`,
              error
            );

            if (attempts <= maxRetries) {
              const delay = baseDelay * Math.pow(1.5, attempts - 1);
              setTimeout(executeImport, delay);
            } else {
              // Check if we haven't already attempted a full reload for this component
              let hasReloaded = false;
              try {
                hasReloaded = !!sessionStorage.getItem(`retry_reload_${componentName}`);
              } catch {
                // ignore
              }

              const errorMsg = String(error?.message || error || '');
              const isFetchOrChunkError =
                error?.name === 'TypeError' ||
                errorMsg.includes('Failed to fetch dynamically imported module') ||
                errorMsg.includes('Loading chunk') ||
                errorMsg.includes('dynamically imported module');

              if (!hasReloaded && isFetchOrChunkError && typeof window !== 'undefined') {
                console.warn(
                  `[lazyWithRetry] All retries exhausted for "${componentName}". Reloading page to fetch updated chunks...`
                );
                try {
                  sessionStorage.setItem(`retry_reload_${componentName}`, 'true');
                } catch {
                  // ignore
                }
                window.location.reload();
                return;
              }

              reject(error);
            }
          });
      };

      executeImport();
    });
  });
}
