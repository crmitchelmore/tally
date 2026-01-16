#!/usr/bin/env bash
set -euo pipefail

RALPH_VERSION="tally-1.0.0"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/ralph-once.sh --prompt <file> [--prd <file>] [--allow-profile <safe|dev|locked>] [--allow-tools <toolSpec> ...] [--deny-tools <toolSpec> ...]

Environment:
  MODEL        Copilot model (default: gpt-5.2)
  COPILOT_CMD  Copilot command to run (default: copilot). Set to "cos" if you use that wrapper.

Notes:
  - You must pass --allow-profile or at least one --allow-tools.
  - Always denied: shell(rm), shell(git push)
USAGE
}

prompt_file=""
prd_file=""
allow_profile=""
declare -a allow_tools deny_tools
allow_tools=()
deny_tools=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt)
      shift
      [[ $# -gt 0 ]] || { echo "Error: --prompt requires a file" >&2; usage; exit 1; }
      prompt_file="$1"
      shift
      ;;
    --prd|--prd=*)
      if [[ "$1" == "--prd" ]]; then
        shift
        [[ $# -gt 0 ]] || { echo "Error: --prd requires a file" >&2; usage; exit 1; }
        prd_file="$1"
        shift
      else
        prd_file="${1#--prd=}"
        shift
      fi
      ;;
    --allow-profile)
      shift
      [[ $# -gt 0 ]] || { echo "Error: --allow-profile requires a value" >&2; usage; exit 1; }
      allow_profile="$1"
      shift
      ;;
    --allow-tools)
      shift
      [[ $# -gt 0 ]] || { echo "Error: --allow-tools requires a tool spec" >&2; usage; exit 1; }
      allow_tools+=("$1")
      shift
      ;;
    --deny-tools)
      shift
      [[ $# -gt 0 ]] || { echo "Error: --deny-tools requires a tool spec" >&2; usage; exit 1; }
      deny_tools+=("$1")
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    *)
      echo "Error: unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

MODEL="${MODEL:-gpt-5.2}"
COPILOT_CMD="${COPILOT_CMD:-copilot}"

[[ -n "$prompt_file" ]] || { echo "Error: --prompt is required" >&2; usage; exit 1; }
[[ -r "$prompt_file" ]] || { echo "Error: prompt file not readable: $prompt_file" >&2; exit 1; }
[[ -z "$prd_file" || -r "$prd_file" ]] || { echo "Error: PRD file not readable: $prd_file" >&2; exit 1; }

progress_file="progress.txt"
[[ -r "$progress_file" ]] || { echo "Error: progress file not readable: $progress_file" >&2; exit 1; }

if [[ -z "$allow_profile" && ${#allow_tools[@]} -eq 0 ]]; then
  echo "Error: you must specify --allow-profile or at least one --allow-tools" >&2
  usage
  exit 1
fi

declare -a copilot_tool_args
copilot_tool_args+=(--deny-tool 'shell(rm)')
copilot_tool_args+=(--deny-tool 'shell(git push)')

if [[ ${#allow_tools[@]} -eq 0 ]]; then
  case "$allow_profile" in
    dev)
      copilot_tool_args+=(--allow-all-tools)
      ;;
    safe)
      copilot_tool_args+=(--allow-tool 'write')
      copilot_tool_args+=(--allow-tool 'shell(git:*)')
      copilot_tool_args+=(--allow-tool 'shell(bun:*)')
      copilot_tool_args+=(--allow-tool 'shell(node:*)')
      copilot_tool_args+=(--allow-tool 'shell(npx:*)')
      ;;
    locked)
      copilot_tool_args+=(--allow-tool 'write')
      ;;
    *)
      echo "Error: unknown --allow-profile: $allow_profile" >&2
      usage
      exit 1
      ;;
  esac
fi

for tool in "${allow_tools[@]}"; do
  copilot_tool_args+=(--allow-tool "$tool")
done
for tool in "${deny_tools[@]}"; do
  copilot_tool_args+=(--deny-tool "$tool")
done

# Single attachment: combine PRD + progress + prompt to avoid multi-@file issues.
context_file="$(mktemp .ralph-context.XXXXXX)"
{
  echo "# Context"
  echo
  if [[ -n "$prd_file" ]]; then
    echo "## PRD ($prd_file)"
    cat "$prd_file"
    echo
  fi
  echo "## progress.txt"
  cat "$progress_file"
  echo
  echo "# Prompt"
  echo
  cat "$prompt_file"
  echo
} >"$context_file"

set +e
result=$(
  "$COPILOT_CMD" --add-dir "$PWD" --model "$MODEL" \
    --no-color --stream off --silent \
    -p "@$context_file Follow the attached prompt." \
    "${copilot_tool_args[@]}" \
    2>&1
)
status=$?
set -e

rm -f "$context_file" >/dev/null 2>&1 || true

echo "$result"
exit "$status"
