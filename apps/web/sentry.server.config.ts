import * as Sentry from "@sentry/nextjs";
import { initSentry } from "@klipai/config/sentry";

initSentry({
  environment: "web-server",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});

export { Sentry };
export const onRequestError = Sentry.captureRequestError;
