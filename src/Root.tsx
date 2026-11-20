import "./index.css";
import { Composition } from "remotion";
import { resolveNarration, VIDEO_FPS } from "./Composition";
import { SmokeTest } from "./SmokeTest";

const smokePreviewFrames = 8 * VIDEO_FPS;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Landscape"
      component={SmokeTest}
      width={1920}
      height={1080}
      fps={VIDEO_FPS}
      durationInFrames={smokePreviewFrames}
      defaultProps={{ captions: [], narrationSrc: null }}
      calculateMetadata={resolveNarration}
    />
    <Composition
      id="Vertical"
      component={SmokeTest}
      width={1080}
      height={1920}
      fps={VIDEO_FPS}
      durationInFrames={smokePreviewFrames}
      defaultProps={{ captions: [], narrationSrc: null }}
      calculateMetadata={resolveNarration}
    />
  </>
);
