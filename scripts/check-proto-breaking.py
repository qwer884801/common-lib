#!/usr/bin/env python3
"""Conservative public proto compatibility check against a git base ref."""

from __future__ import annotations

import argparse
import dataclasses
import os
import pathlib
import re
import subprocess
import sys


@dataclasses.dataclass(frozen=True)
class Field:
    name: str
    type_name: str


@dataclasses.dataclass
class ProtoModel:
    messages: dict[str, dict[int, Field]]
    enums: dict[str, dict[int, str]]
    services: dict[str, set[str]]


def git(root: pathlib.Path, *args: str, check: bool = True) -> str:
    proc = subprocess.run(
        ["git", "-C", str(root), *args],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if check and proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "git command failed")
    if proc.returncode != 0:
        return ""
    return proc.stdout


def strip_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return "\n".join(re.sub(r"//.*", "", line) for line in text.splitlines())


def normalize_type(type_name: str) -> str:
    type_name = " ".join(type_name.split())
    return re.sub(r"\s*([<>,.])\s*", r"\1", type_name)


def message_parent(stack: list[tuple[str, str]]) -> list[str]:
    return [name for kind, name in stack if kind == "message"]


def current_semantic(stack: list[tuple[str, str]]) -> str | None:
    for kind, _ in reversed(stack):
        if kind in {"message", "enum", "service"}:
            return kind
    return None


def current_name(stack: list[tuple[str, str]], kind: str) -> str | None:
    for entry_kind, name in reversed(stack):
        if entry_kind == kind:
            return name
    return None


FIELD_RE = re.compile(
    r"^(?:(optional|repeated|required)\s+)?"
    r"(?P<type>map\s*<[^>]+>|[.\w]+)\s+"
    r"(?P<name>[A-Za-z_]\w*)\s*=\s*(?P<number>\d+)\b"
)
ENUM_VALUE_RE = re.compile(r"^([A-Za-z_]\w*)\s*=\s*(-?\d+)\b")
RPC_RE = re.compile(r"^rpc\s+([A-Za-z_]\w*)\s*\(")
DECL_RE = re.compile(r"^(message|enum|service)\s+([A-Za-z_]\w*)\b")


def parse_proto(text: str) -> ProtoModel:
    model = ProtoModel(messages={}, enums={}, services={})
    stack: list[tuple[str, str]] = []

    for raw_line in strip_comments(text).splitlines():
        line = raw_line.strip()
        if not line:
            continue

        decl = DECL_RE.match(line)
        known_open = False
        if decl:
            kind, name = decl.groups()
            if kind == "message":
                full_name = ".".join(message_parent(stack) + [name])
                model.messages.setdefault(full_name, {})
            elif kind == "enum":
                full_name = ".".join(message_parent(stack) + [name])
                model.enums.setdefault(full_name, {})
            else:
                full_name = name
                model.services.setdefault(full_name, set())
            if "{" in line:
                stack.append((kind, full_name if kind != "service" else name))
                known_open = True
        else:
            semantic = current_semantic(stack)
            if semantic == "message":
                if line.startswith(("option ", "reserved ", "extensions ", "oneof ")):
                    pass
                else:
                    field_match = FIELD_RE.match(line.split("[", 1)[0].strip())
                    if field_match:
                        message_name = current_name(stack, "message")
                        if message_name is not None:
                            label = field_match.group(1) or ""
                            type_name = normalize_type(field_match.group("type"))
                            if label:
                                type_name = f"{label} {type_name}"
                            number = int(field_match.group("number"))
                            model.messages.setdefault(message_name, {})[number] = Field(
                                name=field_match.group("name"),
                                type_name=type_name,
                            )
            elif semantic == "enum":
                enum_match = ENUM_VALUE_RE.match(line)
                if enum_match:
                    enum_name = current_name(stack, "enum")
                    if enum_name is not None:
                        model.enums.setdefault(enum_name, {})[int(enum_match.group(2))] = enum_match.group(1)
            elif semantic == "service":
                rpc_match = RPC_RE.match(line)
                if rpc_match:
                    service_name = current_name(stack, "service")
                    if service_name is not None:
                        model.services.setdefault(service_name, set()).add(rpc_match.group(1))

        opens = line.count("{") - (1 if known_open else 0)
        closes = line.count("}")
        for _ in range(max(0, opens)):
            stack.append(("block", ""))
        for _ in range(closes):
            if stack:
                stack.pop()

    return model


def compare_models(path: str, base: ProtoModel, current: ProtoModel) -> list[str]:
    findings: list[str] = []

    for message_name, base_fields in sorted(base.messages.items()):
        current_fields = current.messages.get(message_name)
        if current_fields is None:
            findings.append(f"{path}: message {message_name} was removed")
            continue
        for number, base_field in sorted(base_fields.items()):
            current_field = current_fields.get(number)
            if current_field is None:
                findings.append(f"{path}: message {message_name} field {number} {base_field.name} was removed")
                continue
            if current_field.name != base_field.name:
                findings.append(
                    f"{path}: message {message_name} field {number} name changed "
                    f"from {base_field.name} to {current_field.name}"
                )
            if current_field.type_name != base_field.type_name:
                findings.append(
                    f"{path}: message {message_name} field {number} type changed "
                    f"from {base_field.type_name} to {current_field.type_name}"
                )

    for enum_name, base_values in sorted(base.enums.items()):
        current_values = current.enums.get(enum_name)
        if current_values is None:
            findings.append(f"{path}: enum {enum_name} was removed")
            continue
        for number, base_name in sorted(base_values.items()):
            current_name_value = current_values.get(number)
            if current_name_value is None:
                findings.append(f"{path}: enum {enum_name} value {number} {base_name} was removed")
            elif current_name_value != base_name:
                findings.append(
                    f"{path}: enum {enum_name} value {number} changed "
                    f"from {base_name} to {current_name_value}"
                )

    for service_name, base_methods in sorted(base.services.items()):
        current_methods = current.services.get(service_name)
        if current_methods is None:
            findings.append(f"{path}: service {service_name} was removed")
            continue
        for method_name in sorted(base_methods):
            if method_name not in current_methods:
                findings.append(f"{path}: service {service_name} rpc {method_name} was removed")

    return findings


def current_proto_paths(root: pathlib.Path, proto_root: pathlib.Path) -> set[str]:
    if not proto_root.exists():
        return set()
    return {path.relative_to(root).as_posix() for path in proto_root.rglob("*.proto")}


def base_proto_paths(root: pathlib.Path, base: str, proto_root: str) -> set[str]:
    output = git(root, "ls-tree", "-r", "--name-only", base, "--", proto_root)
    return {line.strip() for line in output.splitlines() if line.strip().endswith(".proto")}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="origin/main", help="git base ref to compare against")
    parser.add_argument(
        "--proto-root",
        default="proto/byte/v/forge/contracts",
        help="public proto root relative to repository root",
    )
    parser.add_argument("--allow-breaking", action="store_true", help="report findings but exit successfully")
    args = parser.parse_args()

    repo_root = pathlib.Path(__file__).resolve().parents[1]
    proto_root = repo_root / args.proto_root
    allow_breaking = args.allow_breaking or os.environ.get("ALLOW_PROTO_BREAKING") in {"1", "true", "TRUE"}

    try:
        base_paths = base_proto_paths(repo_root, args.base, args.proto_root)
    except RuntimeError as exc:
        print(f"proto breaking check failed to read base ref {args.base}: {exc}", file=sys.stderr)
        return 2

    current_paths = current_proto_paths(repo_root, proto_root)
    findings: list[str] = []

    for rel_path in sorted(base_paths | current_paths):
        current_path = repo_root / rel_path
        if rel_path not in current_paths:
            findings.append(f"{rel_path}: proto file was removed")
            continue
        if rel_path not in base_paths:
            continue
        base_text = git(repo_root, "show", f"{args.base}:{rel_path}")
        current_text = current_path.read_text(encoding="utf-8")
        findings.extend(compare_models(rel_path, parse_proto(base_text), parse_proto(current_text)))

    if findings:
        print("proto breaking changes detected:")
        for finding in findings:
            print(f"- {finding}")
        if allow_breaking:
            print("ALLOW_PROTO_BREAKING is set; continuing with reported breaking changes")
            return 0
        return 1

    print("proto breaking check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
