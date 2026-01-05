import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog with session recording always on, but don't identify until user opts in
export function initPostHog({ user, optedIn }) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_pageview: true,
    disable_session_recording: false, // Always record sessions
    loaded: (ph) => {
      if (optedIn && user?.name) {
        ph.identify(user.name);
      } else {
        ph.reset(); // Use anonymousId
      }
    },
  });
}

// Set opt-in/opt-out and identify user if opted in
export function setPostHogOptIn(optedIn, user) {
  if (optedIn && user?.name) {
    posthog.opt_in_capturing();
    posthog.identify(user.name);
  } else {
    posthog.opt_out_capturing();
    posthog.reset();
  }
}

// Check if user has opted in
export function isPostHogOptedIn() {
  return posthog.has_opted_in_capturing();
}

export default posthog;