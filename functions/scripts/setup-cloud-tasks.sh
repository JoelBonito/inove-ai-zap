#!/bin/bash

# Setup Cloud Tasks Queues for UAZAPI Throttling

PROJECT_ID=$(gcloud config get-value project)
LOCATION="us-central1" # Or your preferred region

echo "Setting up Cloud Tasks queues for project: $PROJECT_ID in $LOCATION"

# 1. Standard Queue (Paid Plan) - 250 requests/min (~4 req/sec)
echo "Creating whatsapp-standard-queue..."
gcloud tasks queues create whatsapp-standard-queue \
    --location=$LOCATION \
    --max-dispatches-per-second=4.0 \
    --max-burst-size=5 \
    --max-attempts=5 \
    --min-backoff=10s \
    --max-backoff=300s \
    --routing-override=service:default

# 2. Safety Queue (Account Protection) - 12 requests/min (~0.2 req/sec)
# Note: Cloud Tasks min rate is effectively lower bounded, but we can control dispatch.
# 0.2 req/sec means 1 request every 5 seconds.
echo "Creating whatsapp-safety-queue..."
gcloud tasks queues create whatsapp-safety-queue \
    --location=$LOCATION \
    --max-dispatches-per-second=0.2 \
    --max-burst-size=1 \
    --max-concurrent-dispatches=1 \
    --max-attempts=10 \
    --min-backoff=30s \
    --max-backoff=600s \
    --routing-override=service:default

echo "Queues created successfully."
