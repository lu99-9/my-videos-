import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadPlusJakartaSans } from "@remotion/google-fonts/PlusJakartaSans";
import { Audio } from "@remotion/media";
import { noise2D } from "@remotion/noise";
import { mouseClick, whip, whoosh } from "@remotion/sfx";
import { type CSSProperties, type PropsWithChildren, useMemo } from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Call at module scope in scenes that use these font roles.
export const loadMotionFonts = () => ({
  body: `${loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily}, sans-serif`,
  display: `${loadPlusJakartaSans("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily}, sans-serif`,
  mono: `${loadJetBrainsMono("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily}, monospace`,
});

const effects = { pop: mouseClick, whip, whoosh };
type Sound = keyof typeof effects;

export const MotionSound = ({
  effect,
  at = 0,
  volume = 0.16,
  src = effects[effect],
}: {
  effect: Sound;
  at?: number;
  volume?: number;
  src?: string;
}) => {
  const { fps } = useVideoConfig();
  return (
    <Audio
      src={src}
      from={Math.round(at * fps)}
      volume={volume}
      premountFor={fps}
    />
  );
};

const settle = (frame: number, fps: number, seconds: number) =>
  spring({
    frame,
    fps,
    durationInFrames: Math.max(1, Math.round(seconds * fps)),
    config: { damping: 22, stiffness: 150, overshootClamping: true },
  });

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export const KineticText = ({
  text,
  reveal = "word",
  start = 0,
  stagger = reveal === "word" ? 0.11 : 0.035,
  sound = false,
  className,
  style,
}: {
  text: string;
  reveal?: "word" | "character";
  start?: number;
  stagger?: number;
  sound?: boolean;
  className?: string;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let index = 0;

  return (
    <span className={className} style={{ whiteSpace: "pre-wrap", ...style }}>
      {text.split(/(\s+)/u).map((word, wordIndex) => {
        if (word.trim() === "") return word;
        const units =
          reveal === "word"
            ? [word]
            : Array.from(graphemes.segment(word), ({ segment }) => segment);
        const wordStart = start + index * stagger;
        index += units.length;

        return (
          <span key={wordIndex} style={{ display: "inline-block" }}>
            {sound && <MotionSound effect="pop" at={wordStart} volume={0.1} />}
            {units.map((unit, unitIndex) => {
              const at = wordStart + unitIndex * stagger;
              const progress = settle(frame - Math.round(at * fps), fps, 0.45);
              return (
                <span
                  key={unitIndex}
                  style={{
                    display: "inline-block",
                    opacity: progress,
                    translate: `0 ${(1 - progress) * 0.65}em`,
                  }}
                >
                  {unit}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
};

const grainTile = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>',
)}")`;

export const FilmGrain = ({ opacity = 0.07 }: { opacity?: number }) => {
  const frame = Math.floor(useCurrentFrame() / 3);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: grainTile,
        backgroundPosition: `${(frame * 47) % 160}px ${(frame * 79) % 160}px`,
        mixBlendMode: "soft-light",
        opacity,
      }}
    />
  );
};

export const Vignette = ({ opacity = 0.4 }: { opacity?: number }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse at center, transparent 42%, #000 100%)",
      opacity,
    }}
  />
);

export const AnimatedGradient = ({
  colors = ["#111b38", "#542b70", "#080b18"],
  start = 0,
  duration = 5,
}: {
  colors?: readonly [string, string, string];
  start?: number;
  duration?: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = settle(frame - Math.round(start * fps), fps, duration);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${25 + progress * 50}% ${28 + progress * 24}%, ${colors[0]}, transparent 62%),
          linear-gradient(135deg, ${colors[1]}, ${colors[2]} 82%)`,
      }}
    />
  );
};

type TimedCamera = PropsWithChildren<{ start?: number; duration?: number }>;

export const CameraShake = ({
  children,
  start = 0,
  duration = 0.35,
  strength = 8,
  seed = "camera",
}: TimedCamera & { strength?: number; seed?: string | number }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const local = frame - Math.round(start * fps);
  const intensity = local < 0 ? 0 : 1 - settle(local, fps, duration);
  const x = noise2D(seed, (local / fps) * 20, 1) * strength * intensity;
  const y = noise2D(seed, (local / fps) * 20, 2) * strength * intensity;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          translate: `${x}px ${y}px`,
          scale: 1 + (2 * strength * intensity) / Math.min(width, height),
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const WhipPan = ({
  children,
  start = 0,
  duration = 0.4,
  direction = "left",
  sound = false,
}: TimedCamera & { direction?: "left" | "right"; sound?: boolean }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const remaining = 1 - settle(frame - Math.round(start * fps), fps, duration);
  const x = remaining * width * (direction === "left" ? 1 : -1);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {sound && <MotionSound effect="whoosh" at={start} />}
      <AbsoluteFill style={{ translate: `${x}px 0` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const KenBurns = ({
  children,
  start = 0,
  duration = 5,
  fromScale = 1,
  toScale = 1.13,
  focus = "50% 45%",
}: TimedCamera & { fromScale?: number; toScale?: number; focus?: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = settle(frame - Math.round(start * fps), fps, duration);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          scale: fromScale + (toScale - fromScale) * progress,
          transformOrigin: focus,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AutoCaptions = ({
  captions,
  highlight = "#eafa80",
}: {
  captions: Caption[];
  highlight?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;
  const now = (frame * 1000) / fps;
  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: vertical ? 680 : 950,
        breakOnSilenceAfterMilliseconds: 320,
      }),
    [captions, vertical],
  );
  const page = pages.find(
    ({ startMs, durationMs, tokens }) =>
      now >= startMs &&
      now <
        Math.min(startMs + durationMs, tokens[tokens.length - 1].toMs + 120),
  );
  if (!page) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.08,
        right: width * 0.08,
        bottom: height * (vertical ? 0.16 : 0.075),
        textAlign: "center",
        fontSize: Math.min(width, height) * (vertical ? 0.058 : 0.052),
        lineHeight: 1.3,
        fontWeight: 800,
        color: "#fff",
        overflowWrap: "anywhere",
      }}
    >
      {page.tokens.map(({ text, fromMs, toMs }, index) => {
        const active = now >= fromMs && now < toMs;
        return (
          <span
            key={index}
            style={{
              backgroundColor: active ? highlight : "#101020",
              color: active ? "#121526" : "#fff",
              borderRadius: "0.14em",
              padding: "0.04em 0.13em",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
};
