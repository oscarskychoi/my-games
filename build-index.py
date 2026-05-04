#!/usr/bin/env python3
"""Build the games landing page for ~/Projects/.

Discovers immediate sub-folders that contain an index.html and writes
~/Projects/index.html with a styled list of links.

Per-game metadata can be provided via meta.json:
  {
    "title": "Snake.exe",
    "description": "키보드 방향키로 사과를 먹는 클래식"
  }

Falls back to the <title> tag, then the folder name.
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime
from html import escape
from pathlib import Path

PROJECTS_DIR = Path(os.environ.get("PROJECTS_DIR", Path.home() / "Projects"))

# Folders to never treat as a game
SKIP_NAMES = {
    "henry", "node_modules", "dist", "build", "tasks",
    "_site", ".git", ".github", ".vscode", ".idea",
}


def discover_games(root: Path) -> list[dict]:
    games = []
    for entry in sorted(root.iterdir(), key=lambda p: p.name.lower()):
        if not entry.is_dir():
            continue
        if entry.name.startswith(".") or entry.name in SKIP_NAMES:
            continue
        index = entry / "index.html"
        if not index.exists():
            continue
        games.append(extract_meta(entry, index))
    return games


def extract_meta(folder: Path, index: Path) -> dict:
    title: str | None = None
    description: str | None = None

    meta_file = folder / "meta.json"
    if meta_file.exists():
        try:
            data = json.loads(meta_file.read_text(encoding="utf-8"))
            title = data.get("title")
            description = data.get("description")
        except Exception as exc:
            print(f"⚠️  {meta_file} 파싱 실패: {exc}", file=sys.stderr)

    if not title:
        try:
            html_text = index.read_text(encoding="utf-8", errors="ignore")
            m = re.search(r"<title[^>]*>(.*?)</title>", html_text,
                          re.IGNORECASE | re.DOTALL)
            if m:
                title = re.sub(r"\s+", " ", m.group(1)).strip() or None
        except Exception:
            pass

    if not title:
        title = folder.name

    return {
        "slug": folder.name,
        "title": title,
        "description": description or "",
    }


def render_games(games: list[dict]) -> str:
    rows = []
    for i, g in enumerate(games, 1):
        num = f"{i:02d}"
        title = escape(g["title"])
        slug = escape(g["slug"])
        desc_html = (
            f'\n            <p>{escape(g["description"])}</p>'
            if g["description"] else ""
        )
        rows.append(
            f'        <li class="game">\n'
            f'          <span class="num">{num}</span>\n'
            f'          <div class="info">\n'
            f'            <h2>{title}</h2>{desc_html}\n'
            f'          </div>\n'
            f'          <a class="play" href="./{slug}/">play &rarr;</a>\n'
            f'        </li>'
        )
    return "\n".join(rows)


TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>an arcade of my own</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0d0d0d;
      --bg-elev: #161616;
      --ink: #f5f1e8;
      --ink-dim: #8a857a;
      --accent: #c4ff3d;
      --line: #2a2a2a;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { background: var(--bg); }
    body {
      background: var(--bg);
      color: var(--ink);
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 14px;
      line-height: 1.6;
      min-height: 100vh;
      padding: 4rem 2rem;
      background-image:
        radial-gradient(circle at 20% 0%, rgba(196,255,61,0.06), transparent 40%),
        radial-gradient(circle at 80% 100%, rgba(196,255,61,0.03), transparent 50%);
    }
    .container { max-width: 960px; margin: 0 auto; }
    header {
      border-bottom: 1px solid var(--line);
      padding-bottom: 2rem;
      margin-bottom: 4rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 2rem;
    }
    .title {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 300;
      font-size: clamp(2.75rem, 9vw, 6.5rem);
      letter-spacing: -0.04em;
      line-height: 0.92;
      font-style: italic;
      font-variation-settings: "opsz" 144;
    }
    .title em {
      font-style: normal;
      color: var(--accent);
      font-weight: 500;
    }
    .meta {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--ink-dim);
      text-align: right;
    }
    .meta strong {
      color: var(--accent);
      display: block;
      font-size: 13px;
      margin-bottom: 0.4rem;
      letter-spacing: 0.1em;
    }
    .games { list-style: none; }
    .game {
      border-bottom: 1px solid var(--line);
      padding: 2rem 0;
      display: grid;
      grid-template-columns: 64px 1fr auto;
      gap: 2rem;
      align-items: center;
      transition: padding 0.25s ease, background 0.25s ease;
    }
    .game:hover {
      background: var(--bg-elev);
      margin: 0 -2rem;
      padding: 2rem;
    }
    .game .num {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 2.25rem;
      color: var(--ink-dim);
      font-style: italic;
      font-weight: 300;
    }
    .game:hover .num { color: var(--accent); }
    .game .info h2 {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 400;
      font-size: clamp(1.5rem, 3.5vw, 2rem);
      letter-spacing: -0.02em;
      margin-bottom: 0.4rem;
      line-height: 1.1;
    }
    .game .info p {
      color: var(--ink-dim);
      font-size: 13px;
      max-width: 500px;
    }
    .game .play {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.22em;
      color: var(--bg);
      background: var(--accent);
      padding: 0.85rem 1.6rem;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: inline-block;
      white-space: nowrap;
    }
    .game .play:hover {
      transform: translate(-3px, -3px);
      box-shadow: 6px 6px 0 var(--ink);
    }
    .empty {
      padding: 4rem 0;
      text-align: center;
      color: var(--ink-dim);
      font-style: italic;
      font-family: 'Fraunces', Georgia, serif;
    }
    footer {
      margin-top: 6rem;
      padding-top: 2rem;
      border-top: 1px solid var(--line);
      font-size: 11px;
      color: var(--ink-dim);
      text-transform: uppercase;
      letter-spacing: 0.18em;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    footer a { color: var(--ink-dim); text-decoration: none; border-bottom: 1px solid var(--line); }
    footer a:hover { color: var(--accent); border-color: var(--accent); }
    @media (max-width: 640px) {
      body { padding: 2.5rem 1.25rem; }
      .game { grid-template-columns: auto 1fr; gap: 1rem 1.25rem; }
      .game .play { grid-column: 1 / -1; justify-self: start; margin-top: 0.5rem; }
      .game:hover { margin: 0 -1.25rem; padding: 2rem 1.25rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1 class="title">an arcade<br>of <em>my own</em>.</h1>
      <div class="meta">
        <strong>__GAME_COUNT__ games</strong>
        last updated __DATE__
      </div>
    </header>
    <ul class="games">
__GAME_LIST__
    </ul>
    <footer>
      <span>made with bash + ❤</span>
      <span>__YEAR__</span>
    </footer>
  </div>
</body>
</html>
"""


def main() -> int:
    if not PROJECTS_DIR.exists():
        print(f"❌ {PROJECTS_DIR} 디렉토리가 없습니다.", file=sys.stderr)
        return 1

    games = discover_games(PROJECTS_DIR)
    now = datetime.now()

    if games:
        body = render_games(games)
    else:
        body = '        <li class="empty">아직 게임이 없습니다. 폴더에 index.html을 추가해 보세요.</li>'

    html = (
        TEMPLATE
        .replace("__GAME_COUNT__", f"{len(games):02d}")
        .replace("__GAME_LIST__", body)
        .replace("__DATE__", now.strftime("%Y.%m.%d"))
        .replace("__YEAR__", str(now.year))
    )

    out = PROJECTS_DIR / "index.html"
    out.write_text(html, encoding="utf-8")

    print(f"✅ {out} 생성 ({len(games)}개 게임)")
    for g in games:
        print(f"   • {g['title']}  →  ./{g['slug']}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
