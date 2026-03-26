#!/bin/bash

# Default to dry run unless --force is passed
DRY_RUN="-n"
if [ "$1" = "--force" ]; then
  DRY_RUN=""
  echo "Running actual sync (without dry run)..."
else
  echo "Running dry run (-n). Pass --force to execute actual sync."
fi

BUCKET_NAME="[YOUR_BUCKET_NAME]"

# Sync assets to Google Cloud Storage
gsutil rsync -r -d $DRY_RUN public/data/ gs://$BUCKET_NAME/data/
