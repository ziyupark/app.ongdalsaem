#!/usr/bin/env bash
# Downloads the official sign-in artwork (run on the Mac, needs internet):
#   Google — "Pre-Approved Brand Icons" bundle  (developers.google.com/identity/branding-guidelines)
#   Apple  — "Sign in with Apple Logo" artwork   (developer.apple.com/design/resources, .dmg)
# Only the SVG/PDF/license files are kept, in _vendor/brand-assets/ (not bundled into the app).
# Claude then picks the exact files for assets/brand/.
# Run from the project root:  bash scripts/fetch-official-logos.sh
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="_vendor/brand-assets"
TMP="$(mktemp -d)"
trap 'hdiutil detach "$TMP/apple" -quiet 2>/dev/null || true; rm -rf "$TMP"' EXIT
mkdir -p "$OUT/google" "$OUT/apple"

echo "1/2 Google…"
curl -fL --retry 5 --retry-all-errors -o "$TMP/google.zip" \
  "https://developers.google.com/static/identity/images/signin-assets.zip"
unzip -q "$TMP/google.zip" -d "$TMP/google"
(cd "$TMP/google" && find . -type f \( -iname '*.svg' -o -iname '*.pdf' -o -iname '*licen*' -o -iname '*readme*' \) -print0 | xargs -0 -I{} rsync -R "{}" "$OLDPWD/$OUT/google/")

echo "2/2 Apple…"
curl -fL --retry 5 --retry-all-errors -o "$TMP/apple.dmg" \
  "https://devimages-cdn.apple.com/design/resources/download/Logo-Sign-in-with-Apple.dmg"
mkdir -p "$TMP/apple"
hdiutil attach -nobrowse -readonly -quiet -mountpoint "$TMP/apple" "$TMP/apple.dmg"
(cd "$TMP/apple" && find . -type f \( -iname '*.svg' -o -iname '*.pdf' -o -iname '*licen*' -o -iname '*agreement*' -o -iname '*readme*' \) -print0 | xargs -0 -I{} rsync -R "{}" "$OLDPWD/$OUT/apple/")

echo
echo "Saved:"
echo "  Google: $(find "$OUT/google" -type f | wc -l | tr -d ' ') files"
echo "  Apple:  $(find "$OUT/apple" -type f | wc -l | tr -d ' ') files"
echo "Done — tell Claude to wire them in."
