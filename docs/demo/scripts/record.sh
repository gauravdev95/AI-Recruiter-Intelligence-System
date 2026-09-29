#!/usr/bin/env bash
# Record a 20-second demo video: Xvfb + kiosk Chrome + ffmpeg x11grab.
# The driver signals readiness via READY_FILE; ffmpeg starts only then,
# so the 20s window is exactly the demo (no hanging waits).
# Usage: ./record.sh <landing|auth>
# Requires: frontend dev server + backend API running.
set -euo pipefail

MODE="${1:?usage: ./record.sh <landing|auth>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
OUT_DIR="$ROOT/docs/demo/videos"
mkdir -p "$OUT_DIR"
READY_FILE="/tmp/demo-ready-$MODE"
rm -f "$READY_FILE"

if [ "$MODE" = "landing" ]; then
  SCRIPT="record_landing.mjs"
  OUT="$OUT_DIR/demo-landing-tour.mp4"
elif [ "$MODE" = "auth" ]; then
  SCRIPT="record_auth.mjs"
  OUT="$OUT_DIR/demo-auth-flow.mp4"
else
  echo "unknown mode: $MODE" >&2
  exit 1
fi

export DISPLAY=:99
export READY_FILE
Xvfb :99 -screen 0 1280x800x24 >/dev/null 2>&1 &
XVFB_PID=$!
cleanup() { kill $XVFB_PID 2>/dev/null || true; rm -f "$READY_FILE"; }
trap cleanup EXIT
sleep 1

cd "$SCRIPT_DIR"
node "$SCRIPT" &
DRIVER_PID=$!

# wait for the driver to signal the page is ready (max 45s)
for i in $(seq 1 90); do
  [ -f "$READY_FILE" ] && break
  sleep 0.5
done
if [ ! -f "$READY_FILE" ]; then
  echo "driver never became ready" >&2
  kill $DRIVER_PID 2>/dev/null || true
  exit 1
fi

ffmpeg -y -v error \
  -f x11grab -video_size 1280x800 -framerate 30 -i :99 \
  -t 20 -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 23 \
  "$OUT"

wait $DRIVER_PID
echo "saved -> $OUT"
