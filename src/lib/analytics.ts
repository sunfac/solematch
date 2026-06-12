/**
 * Analytics adapter — env-gated PostHog with console fallback (plan: owner-blocked
 * items never block). Events: quiz_start/step/complete, reveal_view, offer_click.
 */
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

let distinctId: string | null = null;
const getDistinctId = () => {
  if (!distinctId) distinctId = `anon-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return distinctId;
};

export function track(event: string, properties: Record<string, unknown> = {}): void {
  if (!KEY) {
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${event}`, properties);
    return;
  }
  fetch(`${HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: KEY,
      event,
      distinct_id: getDistinctId(),
      properties: { ...properties, app: 'solematch-mvp' },
    }),
  }).catch(() => {
    /* analytics must never break the app */
  });
}
