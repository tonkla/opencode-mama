#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
SCRIPT_PATH="$SCRIPT_DIR/postinstall.mjs"

case "${npm_execpath:-}" in
  *bun*)
    exec bun "$SCRIPT_PATH"
    ;;
  *)
    exec node "$SCRIPT_PATH"
    ;;
esac
