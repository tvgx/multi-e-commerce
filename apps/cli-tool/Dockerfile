# Multi-stage Dockerfile for E-commerce CLI Tool

# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy CLI source code
COPY . .

# Set environment variables
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    CLI_ENV=production

# Create non-root user
RUN useradd -m -u 1000 cli-user && \
    mkdir -p /home/cli-user/.ecommerce-cli && \
    chown -R cli-user:cli-user /app /home/cli-user

USER cli-user

# Health check - CLI config status
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python main.py config --show > /dev/null 2>&1 || exit 1

# Default command - show help
ENTRYPOINT ["python", "main.py"]
CMD ["--help"]
