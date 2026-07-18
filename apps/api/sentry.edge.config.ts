import * as Sentry from "@sentry/nextjs";
import { initSentry } from "@klipai/config/sentry";

initSentry({
  environment: "api-edge",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: 0,
});

export { Sentry };
