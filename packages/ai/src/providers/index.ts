export { SeedanceProvider } from "./seedance";
export { KlingProvider } from "./kling";
export { WanProvider } from "./wan";
export { BaseProvider } from "./base";

import { SeedanceProvider } from "./seedance";
import { KlingProvider } from "./kling";
import { WanProvider } from "./wan";
import { providerRouter } from "../services/provider-router";
import { env } from "@klipai/config";
import { AIProvider } from "../types";

export function initializeProviders(): void {
  let count = 0;

  // Register providers with API keys from environment
  if (env.SEEDANCE_API_KEY) {
    providerRouter.registerProvider(
      new SeedanceProvider({
        apiKey: env.SEEDANCE_API_KEY,
        baseUrl: env.SEEDANCE_BASE_URL,
      }),
    );
    count++;
  }

  if (env.KLING_API_KEY) {
    providerRouter.registerProvider(
      new KlingProvider({
        apiKey: env.KLING_API_KEY,
        baseUrl: env.KLING_BASE_URL,
      }),
    );
    count++;
  }

  if (env.WAN_API_KEY) {
    providerRouter.registerProvider(
      new WanProvider({
        apiKey: env.WAN_API_KEY,
        baseUrl: env.WAN_BASE_URL,
      }),
    );
    count++;
  }

  console.log(`Initialized ${count} AI providers`);
}

export function getAvailableProviders(): string[] {
  return ["seedance", "kling", "wan"].filter(
    (name) => providerRouter.getProvider(name) !== undefined,
  );
}
