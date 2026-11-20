#!/bin/sh
# FP11: the deployment's branding and switches, from the component's configuration (component.yaml's configSchema),
# into /config.json at start. A value outside its expected shape is left out (the shell's defaults then apply).
set -eu
mkdir -p /tmp/be
str() { # name, value: only letters, digits, spaces and a few marks; JSON-safe
  case "$2" in
    "" ) ;;
    *[!A-Za-z0-9\ ._-]* ) echo "be-config: $1 left out: unexpected characters" >&2 ;;
    * ) printf ',"%s":"%s"' "$1" "$2" ;;
  esac
}
flag() { case "$2" in true|false) printf ',"%s":%s' "$1" "$2" ;; "") ;; *) echo "be-config: $1 is not true or false" >&2 ;; esac; }
color() { case "$2" in "") ;; \#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) printf ',"%s":"%s"' "$1" "$2" ;; *) echo "be-config: $1 is not #rrggbb" >&2 ;; esac; }
path() { case "$2" in "") ;; /*) case "$2" in //*|*[!A-Za-z0-9/._-]*) echo "be-config: $1 left out" >&2 ;; *) printf ',"%s":"%s"' "$1" "$2" ;; esac ;; *) echo "be-config: $1 must be a path on this site" >&2 ;; esac; }
{
  printf '{"source":"deployment"'
  str productName "${PC_PRODUCT_NAME:-}"
  color primaryColor "${PC_PRIMARY_COLOR:-}"
  path logoUrl "${PC_LOGO_URL:-}"
  flag watermark "${PC_WATERMARK:-}"
  flag gray "${PC_GRAY_MODE:-}"
  flag sharedTerminal "${PC_SHARED_TERMINAL:-}"
  printf '}\n'
} > /tmp/be/config.json
