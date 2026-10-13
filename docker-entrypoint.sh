#!/bin/sh
set -e

# Hand over application control to your live Express server engine
exec node /app/server.js