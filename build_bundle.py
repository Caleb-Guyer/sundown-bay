"""Rebuild the GitHub Pages script from its ordered, editable JavaScript sources."""
import hashlib
import json
import re
from pathlib import Path


def build(root):
    index = root / "index.html"
    html = index.read_text(encoding="utf-8")
    manifest = re.search(r'<script type="application/json" id="game-sources">(.*?)</script>', html, re.S)
    if manifest:
        sources = json.loads(manifest[1])
    else:
        sources = re.findall(r'<script src="([\w-]+\.js)"></script>', html)
    if not sources or sources[-1] != "game.js" or len(set(sources)) != len(sources):
        raise ValueError("Game source order is missing or duplicated")
    pieces = []
    for name in sources:
        if not re.fullmatch(r'[\w-]+\.js', name) or name == "sundown.js":
            raise ValueError(f"Invalid source file {name!r}")
        pieces.append(f"/* {name} */\n" + (root / name).read_text(encoding="utf-8"))
    data = "\n;\n".join(pieces).encode("utf-8")
    version = hashlib.sha256(data).hexdigest()[:16]
    tag = f'<script src="sundown.js?v={version}"></script>'
    if manifest:
        html, changed = re.subn(r'<script src="sundown\.js\?v=[0-9a-f]+"></script>', tag, html)
        if changed != 1:
            raise ValueError("Expected one game bundle")
    else:
        listing = '<script type="application/json" id="game-sources">' + json.dumps(sources, indent=2) + '</script>'
        block = r'(?:[ \t]*<script src="[\w-]+\.js"></script>\s*)+'
        html, changed = re.subn(block, lambda _: "  " + listing + "\n  " + tag + "\n", html)
        if changed != 1:
            raise ValueError("Game scripts must form a single ordered group")
    (root / "sundown.js").write_bytes(data)
    index.write_text(html, encoding="utf-8", newline="\n")
    return version


if __name__ == "__main__":
    print("Built sundown.js", build(Path(__file__).resolve().parent))
