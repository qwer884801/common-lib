#!/usr/bin/env python3
"""Validate common-lib event catalog definitions without running service code."""

from __future__ import annotations

import pathlib
import re
import sys


def strip_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return "\n".join(re.sub(r"//.*", "", line) for line in text.splitlines())


def matching_block(text: str, start: int) -> str:
    depth = 0
    for index in range(start, len(text)):
        char = text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1 : index]
    raise ValueError("unterminated Definition block")


def parse_constants(text: str) -> dict[str, str]:
    constants: dict[str, str] = {}
    for match in re.finditer(r"\b([A-Za-z_]\w*)\s*=\s*\"([^\"]*)\"", text):
        constants[match.group(1)] = match.group(2)
    return constants


def parse_value(value: str, constants: dict[str, str]) -> object:
    value = value.strip().rstrip(",")
    if value.startswith('"') and value.endswith('"'):
        return value[1:-1]
    if value in constants:
        return constants[value]
    if value in {"true", "false"}:
        return value == "true"
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    return value


def parse_definitions(text: str) -> dict[str, dict[str, object]]:
    constants = parse_constants(text)
    definitions: dict[str, dict[str, object]] = {}
    for match in re.finditer(r"\b([A-Za-z_]\w*)\s*=\s*Definition\s*{", text):
        name = match.group(1)
        block = matching_block(text, match.end() - 1)
        fields: dict[str, object] = {}
        for field_match in re.finditer(r"\b([A-Za-z_]\w*)\s*:\s*([^,\n]+)", block):
            fields[field_match.group(1)] = parse_value(field_match.group(2), constants)
        definitions[name] = fields
    return definitions


def parse_all_names(text: str) -> list[str]:
    match = re.search(r"func\s+All\s*\(\)\s*\[\]Definition\s*{.*?return\s+\[\]Definition\s*{(?P<body>.*?)}\s*}", text, re.DOTALL)
    if not match:
        raise ValueError("eventcatalog.All return list was not found")
    return re.findall(r"\b[A-Z][A-Za-z0-9_]*\b", match.group("body"))


def text_field(fields: dict[str, object], name: str) -> str:
    value = fields.get(name)
    return value.strip() if isinstance(value, str) else ""


def int_field(fields: dict[str, object], name: str) -> int:
    value = fields.get(name)
    return value if isinstance(value, int) else 0


def bool_field(fields: dict[str, object], name: str) -> bool:
    value = fields.get(name)
    return value if isinstance(value, bool) else False


def validate_definition(name: str, fields: dict[str, object]) -> list[str]:
    findings: list[str] = []
    subject = text_field(fields, "Subject")
    event_name = text_field(fields, "EventName")
    event_version = text_field(fields, "EventVersion")
    kind = text_field(fields, "Kind")
    payload_type = text_field(fields, "PayloadType")
    owner_service = text_field(fields, "OwnerService")
    durable = text_field(fields, "ConsumerDurable")

    for field_name, value in (
        ("Subject", subject),
        ("EventName", event_name),
        ("EventVersion", event_version),
        ("Kind", kind),
        ("PayloadType", payload_type),
        ("OwnerService", owner_service),
    ):
        if not value:
            findings.append(f"{name}: {field_name} is required")

    if subject and not subject.startswith("byte.v.forge."):
        findings.append(f"{name}: subject must use byte.v.forge prefix")
    if event_name and not re.fullmatch(r"[a-z0-9]+(\.[a-z0-9_]+)+", event_name):
        findings.append(f"{name}: event name must be a dotted lower-case identifier")
    if kind not in {"KindFact", "KindCommand"}:
        findings.append(f"{name}: kind must be KindFact or KindCommand")
    if payload_type and not payload_type.startswith("byte.v.forge."):
        findings.append(f"{name}: payload type must be a byte.v.forge proto full name")

    if kind == "KindCommand":
        if not durable:
            findings.append(f"{name}: command events require ConsumerDurable")
        if not bool_field(fields, "Retryable"):
            findings.append(f"{name}: command events must be retryable")
        if int_field(fields, "MaxDeliveries") <= 0:
            findings.append(f"{name}: command events require MaxDeliveries")
        if int_field(fields, "RetryDelaySecond") <= 0:
            findings.append(f"{name}: command events require RetryDelaySecond")
    elif kind == "KindFact":
        if durable:
            findings.append(f"{name}: fact events must not define a single ConsumerDurable")

    return findings


def duplicate_values(definitions: dict[str, dict[str, object]], field: str) -> list[str]:
    seen: dict[str, str] = {}
    duplicates: list[str] = []
    for name, fields in definitions.items():
        value = text_field(fields, field)
        if not value:
            continue
        if value in seen:
            duplicates.append(f"{name}: {field} duplicates {seen[value]}: {value}")
        seen[value] = name
    return duplicates


def main() -> int:
    repo_root = pathlib.Path(__file__).resolve().parents[1]
    catalog_path = repo_root / "eventcatalog" / "catalog.go"
    text = strip_comments(catalog_path.read_text(encoding="utf-8"))
    definitions = parse_definitions(text)
    all_names = parse_all_names(text)

    findings: list[str] = []
    if not definitions:
        findings.append("event catalog has no definitions")

    for name in all_names:
        if name not in definitions:
            findings.append(f"eventcatalog.All references unknown definition: {name}")
    for name in definitions:
        if name not in all_names:
            findings.append(f"{name}: definition is not included in eventcatalog.All")

    findings.extend(duplicate_values(definitions, "Subject"))
    findings.extend(duplicate_values(definitions, "EventName"))
    findings.extend(duplicate_values(definitions, "ConsumerDurable"))
    for name, fields in sorted(definitions.items()):
        findings.extend(validate_definition(name, fields))

    if findings:
        print("event catalog check failed:")
        for finding in findings:
            print(f"- {finding}")
        return 1

    print("event catalog check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
