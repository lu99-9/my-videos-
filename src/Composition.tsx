import type { Caption } from "@remotion/captions";
import {
  type CalculateMetadataFunction,
  getStaticFiles,
  staticFile,
} from "remotion";
export const VIDEO_FPS = 30;
const narrationAudio = "audio/voiceover.mp3";
const narrationTiming = "audio/voiceover.json";

export type SmokeTestProps = {
  captions: Caption[];
  narrationSrc: string | null;
  cueSrc?: string;
};

export const resolveNarration: CalculateMetadataFunction<
  SmokeTestProps
> = async ({ abortSignal, props, compositionId }) => {
  const assets = getStaticFiles();
  const audio = assets.find(({ name }) => name === narrationAudio);
  const timing = assets.find(({ name }) => name === narrationTiming);

  if (!audio) {
    if (timing) throw new Error("voiceover.json requires voiceover.mp3.");
    return {};
  }

  const narrationSrc = staticFile(narrationAudio);
  const audioResponse = await fetch(narrationSrc, { signal: abortSignal });
  if (!audioResponse.ok) {
    throw new Error(`Cannot load voiceover audio (${audioResponse.status}).`);
  }
  // Decode the playable samples so MP3 encoder padding does not add a frame.
  const context = new OfflineAudioContext(1, 1, 48_000);
  const decoded = await context.decodeAudioData(
    await audioResponse.arrayBuffer(),
  );
  const durationInSeconds = decoded.duration;
  if (!Number.isFinite(durationInSeconds) || durationInSeconds <= 0) {
    throw new Error(`Cannot determine the duration of ${narrationAudio}.`);
  }

  let captions: Caption[] = [];
  if (timing) {
    const response = await fetch(staticFile(narrationTiming), {
      signal: abortSignal,
    });
    if (!response.ok) {
      throw new Error(`Cannot load voiceover timings (${response.status}).`);
    }
    captions = await response.json();
    if (!Array.isArray(captions) || captions.length === 0) {
      throw new Error(`No narration captions found for ${compositionId}.`);
    }
  }
  return {
    durationInFrames: Math.ceil(durationInSeconds * VIDEO_FPS) + VIDEO_FPS,
    props: { ...props, captions, narrationSrc },
  };
};
