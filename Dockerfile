FROM node:20-bookworm-slim AS frontend

WORKDIR /app/web_app
COPY web_app/package*.json ./
RUN npm ci
COPY web_app/ ./
RUN npm run build

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/data/.cache/huggingface \
    TORCH_HOME=/data/.cache/torch \
    IOPAINT_MODEL_DIR=/data/.cache

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt setup.py README.md ./
COPY iopaint ./iopaint
COPY --from=frontend /app/web_app/dist ./iopaint/web_app
COPY scripts/hf_start.sh ./scripts/hf_start.sh

RUN pip install --upgrade pip setuptools wheel \
    && pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install -e .

EXPOSE 7860

CMD ["bash", "scripts/hf_start.sh"]
