"""Generate an Edge neural MP3 and Remotion Caption[] JSON sidecar."""

import argparse
import asyncio
import json
import math
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

import edge_tts

MIN_MP3_BYTES = 10_000


async def generate(script: str, voice: str, output: Path, duration: float | None = None) -> None:
    output.mkdir(parents=True, exist_ok=True)
    captions = []
    audio_bytes = 0
    with TemporaryDirectory(dir=output) as temporary:
        mp3 = Path(temporary) / "voiceover.mp3"
        timing = Path(temporary) / "voiceover.json"
        speech = edge_tts.Communicate(script, voice, boundary="WordBoundary")
        with mp3.open("wb") as audio:
            async for event in speech.stream():
                if event["type"] == "audio":
                    audio_bytes += audio.write(event["data"])
                elif event["type"] == "WordBoundary":
                    start = event["offset"] / 10_000
                    end = (event["offset"] + event["duration"]) / 10_000
                    captions.append({
                        "text": (" " if captions else "") + event["text"],
                        "startMs": start,
                        "endMs": end,
                        "timestampMs": start,
                        "confidence": None,
                    })
        if not audio_bytes or not captions:
            raise RuntimeError("Edge returned no audio or word timings.")
        if duration is not None:
            # Preserve the original pace unless the words would reach the trim point.
            tempo = max(1.0, max(caption["endMs"] for caption in captions) / (duration * 950))
            adjusted = Path(temporary) / "adjusted.mp3"
            subprocess.run(
                ["ffmpeg", "-v", "error", "-i", str(mp3), "-af",
                 f"atempo={tempo},apad,atrim=duration={duration}", "-q:a", "2", str(adjusted)],
                check=True,
            )
            adjusted.replace(mp3)
            for caption in captions:
                for field in ("startMs", "endMs", "timestampMs"):
                    caption[field] /= tempo
        size = mp3.stat().st_size
        if size <= MIN_MP3_BYTES:
            raise RuntimeError(
                f"Voiceover MP3 is {size} bytes; expected more than {MIN_MP3_BYTES}."
            )
        timing.write_text(json.dumps(captions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        mp3.replace(output / mp3.name)
        timing.replace(output / timing.name)
    print(f"Edge TTS succeeded ({voice}): {size} MP3 bytes, {len(captions)} word timings.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("script", help="Text to narrate")
    parser.add_argument("--voice", default="en-US-AndrewNeural")
    parser.add_argument("--duration", type=float, help="Target audio length in seconds (requires FFmpeg)")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "public" / "audio",
    )
    args = parser.parse_args()
    if not args.script.strip():
        parser.error("Provide a non-empty narration script.")
    if args.duration is not None and (not math.isfinite(args.duration) or args.duration <= 0):
        parser.error("Duration must be a finite positive number.")
    asyncio.run(generate(args.script, args.voice, args.output_dir, args.duration))
    print(f"Saved voiceover.mp3 and voiceover.json in {args.output_dir}")


if __name__ == "__main__":
    main()
