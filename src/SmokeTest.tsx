import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SmokeTestProps } from "./Composition";
import {
  AnimatedGradient,
  AutoCaptions,
  FilmGrain,
  KineticText,
  MotionSound,
  Vignette,
} from "./components/MotionKit";

const entrance = 0.16;
const lime = "#eafa80";

export const SmokeTest: React.FC<SmokeTestProps> = ({
  captions,
  narrationSrc,
  cueSrc,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const vertical = height > width;
  const unit = Math.min(width, height);
  const draw = spring({
    fps,
    frame: frame - Math.round(fps * entrance),
    durationInFrames: Math.round(fps * 0.7),
    config: { damping: 22, overshootClamping: true },
  });

  return (
    <AbsoluteFill
      style={{ color: "#f2faf6", fontFamily: "system-ui, sans-serif" }}
    >
      <AnimatedGradient colors={["#174748", "#142e31", "#070d12"]} />
      <FilmGrain />
      <Vignette />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: width * 0.08,
          paddingBottom: height * (vertical ? 0.19 : 0.16),
          gap: unit * 0.035,
          textAlign: "center",
        }}
      >
        <svg
          width={unit * 0.15}
          height={unit * 0.15}
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="#101d22"
            stroke="#426249"
            strokeWidth="1.5"
          />
          <path
            d="M29 51 L44 66 L72 35"
            stroke={lime}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1 1"
            strokeDashoffset={interpolate(draw, [0, 1], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
        </svg>
        <h1
          style={{
            fontSize: unit * (vertical ? 0.136 : 0.125),
            fontWeight: 800,
            letterSpacing: "-0.055em",
            lineHeight: 0.93,
            margin: 0,
          }}
        >
          <KineticText
            text={vertical ? "SYSTEM\nONLINE" : "SYSTEM ONLINE"}
            start={entrance}
          />
        </h1>
      </AbsoluteFill>
      {(narrationSrc || cueSrc) && (
        <MotionSound effect="pop" at={entrance} volume={0.09} src={cueSrc} />
      )}
      {narrationSrc && <Audio src={narrationSrc} premountFor={fps} />}
      <AutoCaptions captions={captions} highlight={lime} />
    </AbsoluteFill>
  );
};
