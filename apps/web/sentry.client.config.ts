import * as Sentry from "@sentry/nextjs";
import { initSentry } from "@klipai/config/sentry";

initSentry({
  environment: "web-client",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.5,
});

export { Sentry };
