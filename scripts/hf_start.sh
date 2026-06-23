#!/usr/bin/env bash
set -euo pipefail

mkdir -p "${IOPAINT_MODEL_DIR:-/data/.cache}"

exec iopaint start \
  --model=lama \
  --device=cpu \
  --host=0.0.0.0 \
  --port="${PORT:-7860}" \
  --model-dir="${IOPAINT_MODEL_DIR:-/data/.cache}"
