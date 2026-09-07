#!/bin/sh
set -e

# Renders dist/index.html from the template with public config inlined, so no
# separate /env-config.js exists for anyone to fetch. Config still comes from
# the stack file at deploy time: changing it is a redeploy, not a rebuild.
node /app/generate-env.js

# exec so serve becomes PID 1 and receives Swarm stop signals directly.
exec serve -s dist -l 3000
