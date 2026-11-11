#!/usr/bin/env bash
# Downloads the static assets used by 1.1 · 1.1b · 1.2 · 1.4 (1.2 hero is now the Gradient/Welcome mesh — no photo) from Figma (fileKey GL8f8wHgzzK4GDUffY4NPW).
# Figma MCP asset URLs expire 7 days after they were issued (2026-11-05) — re-export from Figma after that.
# Run from the project root:  bash scripts/fetch-figma-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="https://www.figma.com/api/mcp/asset"

fetch() { # <figma asset id.ext> <destination> <figma node>
  mkdir -p "$(dirname "$2")"
  if [ -s "$2" ]; then printf '  %-36s already here\n' "$2"; return; fi
  curl -fsSL --retry 5 --retry-all-errors "$BASE/$1" -o "$2.part" && mv "$2.part" "$2"
  printf '  %-36s %8s bytes  (node %s)\n' "$2" "$(wc -c < "$2" | tr -d ' ')" "$3"
}

echo "Fetching Figma assets…"
fetch da4ed588-2a0d-4861-a838-9ef03a3a0878.png assets/ongi/ongi_clear.png         "480:13065 clear 1 (1.1b)"
fetch aa195d8c-563e-4e6f-bf79-d5e568907782.png assets/weather3d/weather3d_clear.png "14:344 orb (1.4)"
fetch c89a1369-b25f-4dfc-9258-808b5f15ab63.svg assets/brand/acorn-symbol.svg      "134:11241 Acorn Symbol (1.1)"
fetch 95f00ac5-bc6a-46e8-b692-3aef49774a7b.svg assets/icons/acorn.svg             "436:10489 icon/acorn 16 (1.1b)"
fetch 6d53c0b1-a59c-4b22-88bf-d47d5e47fb67.png assets/mock/kimchi1.png          "photo:kimchi1 (2.1 Story · Nearby · feed 1)"
fetch b2e8721d-90d3-44e2-97a5-d542d43bafa9.png assets/mock/hotpot.png           "feed 2 media (2.1)"
fetch ad410f86-fdb0-4b6c-9411-1116ba2d7227.png assets/mock/eggRice-a.png        "slot Lunch (2.1)"
fetch e1f51b3b-e402-4534-90b0-ed0a31609e86.png assets/mock/eggRice-b.png        "slot Now (2.1)"
fetch fdf6726c-4188-4200-b1fe-141d18056cf0.png assets/mock/eggRice-c.png        "slot Late · feed 3 (2.1)"
fetch 742b6a89-5669-4796-a811-09e615d00cbf.png assets/mock/pick-kimchi.png      "Pick Card (2.5)"
fetch 8f2c6c10-0374-4d6f-93d9-76b1aa6bcd59.png assets/mock/avatar-minji.png     "avatar minji (2.1)"
fetch 0122c231-d9a3-4fb0-bbcc-cf58cfbd6305.png assets/mock/avatar-jae.png       "avatar jae (2.1)"
fetch b52dc6b5-faa5-494e-9795-88a0876b69b3.png assets/mock/avatar-sora.png      "avatar sora (2.1)"
echo "Done."
