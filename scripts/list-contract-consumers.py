#!/usr/bin/env python3
"""List sibling repositories that consume common-lib public contracts."""

from __future__ import annotations

import argparse
import os
import pathlib


REPOS = (
    "gpt",
    "gpt-private",
    "gopay-app",
    "mailbox",
    "sms",
    "wa-app",
    "browser-automation",
    "proxy-runtime",
    "workflow-runtime",
    "webui",
    "deploy",
)

PATTERNS = {
    "go generated proto": "github.com/byte-v-forge/common-lib/gen/go",
    "go module dependency": "github.com/byte-v-forge/common-lib",
    "source proto import": "common-lib/proto",
    "common UI proto": "@byte-v-forge/common-ui/proto",
    "common UI package": "@byte-v-forge/common-ui",
}

SKIP_DIRS = {
    ".git",
    ".codex",
    ".venv",
    "node_modules",
    "dist",
    "build",
    "vendor",
    "__pycache__",
}


def file_text(path: pathlib.Path) -> str:
    try:
        if path.stat().st_size > 2_000_000:
            return ""
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ""


def scan_repo(repo_path: pathlib.Path) -> set[str]:
    reasons: set[str] = set()
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [name for name in dirs if name not in SKIP_DIRS]
        for filename in files:
            path = pathlib.Path(root) / filename
            text = file_text(path)
            if not text:
                continue
            for reason, pattern in PATTERNS.items():
                if pattern in text:
                    reasons.add(reason)
    return reasons


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", default=str(pathlib.Path(__file__).resolve().parents[2]))
    args = parser.parse_args()

    source_root = pathlib.Path(args.source_root).resolve()
    found = False
    for repo in REPOS:
        repo_path = source_root / repo
        if not repo_path.exists():
            continue
        reasons = scan_repo(repo_path)
        if not reasons:
            continue
        found = True
        print(f"{repo}: {', '.join(sorted(reasons))}")

    if not found:
        print("no common-lib contract consumers found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
