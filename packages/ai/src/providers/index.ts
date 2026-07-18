// Video Generation Providers
export { SeedanceProvider } from "./seedance";
export { KlingProvider } from "./kling";
export { WanProvider } from "./wan";
export { BaseProvider } from "./base";

// Audio & Multi-modal Providers (Phase 11.4)
export { BaseAudioProvider } from "./audio/base";
export { ElevenLabsProvider } from "./audio/elevenlabs";
export { CoquiProvider } from "./audio/coqui";
export { SadTalkerProvider, Wav2LipProvider } from "./audio/sadtalker";
export { SunoProvider, UdioProvider } from "./audio/suno";

import { SeedanceProvider } from "./seedance";
import { KlingProvider } from "./kling";
import { WanProvider } from "./wan";
import { providerRouter } from "../services/provider-router";
import { env } from "@klipai/config";
import { AIProvider } from "../types";

// Audio providers
import { ElevenLabsProvider } from "./audio/elevenlabs";
import { CoquiProvider } from "./audio/coqui";
import { SadTalkerProvider, Wav2LipProvider } from "./audio/sadtalker";
import { SunoProvider, UdioProvider } from "./audio/suno";

export function initializeProviders(): void {
  let count = 0;

  // Register video generation providers
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

  // Register audio providers (Phase 11.4)
  if (env.ELEVENLABS_API_KEY) {
    providerRouter.registerAudioProvider(new ElevenLabsProvider());
    count++;
  }

  if (env.COQUI_API_KEY) {
    providerRouter.registerAudioProvider(new CoquiProvider());
    count++;
  }

  if (env.SADTALKER_API_KEY) {
    providerRouter.registerAudioProvider(new SadTalkerProvider());
    count++;
  }

  if (env.WAV2LIP_API_KEY) {
    providerRouter.registerAudioProvider(new Wav2LipProvider());
    count++;
  }

  if (env.SUNO_API_KEY) {
    providerRouter.registerAudioProvider(new SunoProvider());
    count++;
  }

  if (env.UDIO_API_KEY) {
    providerRouter.registerAudioProvider(new UdioProvider());
    count++;
  }

  console.log(`Initialized ${count} AI providers (video + audio)`);
}

export function getAvailableProviders(): string[] {
  return ["seedance", "kling", "wan"].filter(
    (name) => providerRouter.getProvider(name) !== undefined,
  );
}

export function getAvailableAudioProviders(): string[] {
  return ["elevenlabs", "coqui", "sadtalker", "wav2lip", "suno", "udio"].filter(
    (name) => providerRouter.getAudioProvider(name) !== undefined,
  );
}
