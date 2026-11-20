# My Videos

This Remotion project includes a single-scene pipeline check in `src/SmokeTest.tsx`. Edit it in Remotion Studio using Node.js 24. `src/Root.tsx` registers `SmokeTest` as `Landscape` (1920×1080) and `Vertical` (1080×1920).

```sh
npm ci
npm run dev
```

Run `npm run lint` to check the source and `npm run render` to export `out/output-landscape.mp4` and `out/output-vertical.mp4`. Run `npm run render:landscape` or `npm run render:vertical` to export one format.

If your environment blocks Remotion's browser download, use an installed Chromium with `npm run render:landscape -- --browser-executable=/usr/bin/chromium` or the equivalent vertical command.

Tailwind CSS v4 is enabled in compositions. Transitions and Google Fonts are available through `@remotion/transitions` and `@remotion/google-fonts`.

Pushes to `main` and pull requests run **Render video** on GitHub's standard Ubuntu runner. Open **Actions → Render video**, select a successful run, and download **remotion-video** under **Artifacts**. The ZIP contains both MP4s. Artifacts expire after seven days, and a daily cleanup removes any older `remotion-video` artifacts. You can also start a render manually from the workflow page.

The workflow uses H.264 at CRF 18 with BT.709, `yuv420p`, and `--concurrency=100%`. It caches `node_modules` and Chrome Headless Shell in `~/.cache/remotion` by lockfile and runner architecture.

Standard GitHub-hosted runners are free for public repositories. Private repositories use your plan's included Actions minutes and artifact storage.

The official Remotion agent skills are installed for Codex in `.agents/skills/`.

## MotionKit

Import `KineticText`, `AnimatedGradient`, `FilmGrain`, `Vignette`, `CameraShake`, `WhipPan`, `KenBurns`, and `MotionSound` from `src/components/MotionKit.tsx`. `start`, `stagger`, `duration`, and `at` are in seconds relative to the enclosing sequence. Set `reveal="character"` for grapheme-by-grapheme text. Enable `sound` for word accents or a whip-pan whoosh, or place a `MotionSound` cue at an explicit `at` time.

Call `loadMotionFonts()` at module scope to get display, body, and mono font families. The default fonts and sound effects load from Google Fonts and Remotion. `MotionSound` also accepts a `src` override for a local asset.

## Narration and captions

Generate the voiceover locally with Python and the Edge online speech service.

```sh
python3 -m pip install -r scripts/requirements-voiceover.txt
python3 scripts/generate-voiceover.py \
  'Pipeline online. Voiceover, kinetic typography, captions, and dual-format cloud rendering are all working.' \
  --duration 7
```

The generator writes `public/audio/voiceover.mp3` and `public/audio/voiceover.json`. The optional `--duration 7` uses FFmpeg to fit the audio to seven seconds. Both compositions measure the MP3 and add a one-second outro. The JSON sidecar enables word highlighting with `AutoCaptions`. CI synthesizes fresh Edge narration on every render run and stops if generation or audio validation fails. The generated MP3 and JSON are ignored by Git. Studio shows a silent eight-second preview when the assets are absent.
