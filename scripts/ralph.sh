#!/usr/bin/env bash
set -e
set -o pipefail

RALPH_VERSION="tally-1.0.0"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/ralph.sh --prompt <file> [--prd <file>] [--allow-profile <safe|dev|locked>] [--allow-tools <toolSpec> ...] [--deny-tools <toolSpec> ...] [iterations]

Environment:
  MODEL        Copilot model (default: gpt-5.2-codex)
  COPILOT_CMD  Copilot command to run (default: copilot). Set to "cos" if you use that wrapper.

Notes:
  - Defaults to YOLO (dev) tools if you don’t specify --allow-profile/--allow-tools.
  - Defaults to 100 iterations if [iterations] is omitted.
USAGE
}

prompt_file=""
prd_file=""
allow_profile="dev"
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
      break
      ;;
  esac
done

iterations="${1:-1000}"

if ! [[ "$iterations" =~ ^[0-9]+$ ]] || [[ "$iterations" -lt 1 ]]; then
  echo "Error: [iterations] must be a positive integer" >&2
  usage
  exit 1
fi

MODEL="${MODEL:-gpt-5.2-codex}"
COPILOT_CMD="${COPILOT_CMD:-copilot}"

# Apply common zsh alias defaults (cos/co) while always executing the real `copilot` binary.
# cos='copilot --yolo --disable-mcp-server multitasker --disable-mcp-server chrome-devtools'
# co='copilot --yolo --disable-mcp-server mobile-mcp --disable-mcp-server vibium --disable-mcp-server multitasker --disable-mcp-server chrome-devtools --disable-mcp-server mcpxcodebuild'
extra_cmd_args=()
case "$COPILOT_CMD" in
  copilot)
    ;;
  cos)
    COPILOT_CMD="copilot"
    extra_cmd_args+=(--yolo --disable-mcp-server multitasker --disable-mcp-server chrome-devtools)
    ;;
  co)
    COPILOT_CMD="copilot"
    extra_cmd_args+=(--yolo --disable-mcp-server mobile-mcp --disable-mcp-server vibium --disable-mcp-server multitasker --disable-mcp-server chrome-devtools --disable-mcp-server mcpxcodebuild)
    ;;
  *)
    # If it's a real executable, just run it.
    ;;
esac

# Without --yolo, Copilot may block waiting for interactive approvals; under PTY
# capture that looks like a hang. Default dev profile should be non-interactive.
if [[ "$(basename "$COPILOT_CMD")" == "copilot" && "$allow_profile" == "dev" ]]; then
  extra_cmd_args+=(--yolo)
fi

command -v "$COPILOT_CMD" >/dev/null 2>&1 || { echo "Error: COPILOT_CMD not found: $COPILOT_CMD" >&2; exit 127; }

[[ -n "$prompt_file" ]] || { echo "Error: --prompt is required" >&2; usage; exit 1; }
[[ -r "$prompt_file" ]] || { echo "Error: prompt file not readable: $prompt_file" >&2; exit 1; }
[[ -z "$prd_file" || -r "$prd_file" ]] || { echo "Error: PRD file not readable: $prd_file" >&2; exit 1; }

progress_file="progress.txt"
[[ -r "$progress_file" ]] || { echo "Error: progress file not readable: $progress_file" >&2; exit 1; }

# Prevent indefinite hangs (e.g. when `script`/PTY capture wedges).
# On macOS we rely on GNU coreutils `timeout` (Homebrew: coreutils) when available.
RALPH_TIMEOUT_SECONDS="${RALPH_TIMEOUT_SECONDS:-7200}"

run_with_timeout() {
  local timeout_s="$1"
  shift

  local timeout_cmd=""
  if command -v timeout >/dev/null 2>&1; then
    timeout_cmd="timeout"
  elif command -v gtimeout >/dev/null 2>&1; then
    timeout_cmd="gtimeout"
  fi

  if [[ -n "$timeout_cmd" ]]; then
    "$timeout_cmd" --kill-after=5s "${timeout_s}s" "$@"
    return $?
  fi

  # Fallback when coreutils timeout isn't on PATH: run the command in its own
  # process group and kill the whole group on timeout to avoid indefinite hangs.
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$timeout_s" "$@" <<'PY'
import os
import signal
import subprocess
import sys

timeout_s = int(sys.argv[1])
cmd = sys.argv[2:]

p = subprocess.Popen(cmd, preexec_fn=os.setsid)
try:
  p.wait(timeout=timeout_s)
  raise SystemExit(p.returncode)
except subprocess.TimeoutExpired:
  try:
    os.killpg(p.pid, signal.SIGTERM)
  except ProcessLookupError:
    raise SystemExit(124)
  try:
    p.wait(timeout=5)
  except subprocess.TimeoutExpired:
    try:
      os.killpg(p.pid, signal.SIGKILL)
    except ProcessLookupError:
      pass
    p.wait()
  raise SystemExit(124)
PY
    return $?
  fi

  "$@"
}


declare -a copilot_tool_args

if [[ ${#allow_tools[@]} -eq 0 ]]; then
  case "$allow_profile" in
    dev)
      copilot_tool_args+=(--allow-all-tools)
      # Ensure non-interactive approvals in dev runs.
      copilot_tool_args+=(--yolo)
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

for ((i=1; i<=iterations; i++)); do
  echo
  echo "Iteration $i"
  echo "------------------------------------"

  combined_file="$(mktemp -t ralph-combined.${i}.XXXXXX)"
  {
    echo "# Context"
    echo

    # Always include all local skills.
    if ls .github/skills/*.md >/dev/null 2>&1; then
      echo "## Skills"
      for f in .github/skills/*.md; do
        echo
        echo "### $(basename "$f")"
        echo
        cat "$f"
      done
      echo
    fi

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
  } >"$combined_file"

  set +e

  copilot_prompt="Ship the next PRD item per instructions in this file. @$combined_file"
  combined_dir="$(dirname "$combined_file")"

  # The PTY created by `script` can trigger interactive prompts from Copilot CLI.
  # Prefer plain capture for dev runs.
  if command -v script >/dev/null 2>&1 && [[ "$allow_profile" != "dev" ]]; then
    transcript_file="$(mktemp -t ralph-copilot.XXXXXX)"
    transcript_err_file="$(mktemp -t ralph-copilot-err.XXXXXX)"

    run_with_timeout "$RALPH_TIMEOUT_SECONDS" \
      script -q -F "$transcript_file" \
        "$COPILOT_CMD" ${extra_cmd_args:+"${extra_cmd_args[@]}"} --add-dir "$PWD" --add-dir "$combined_dir" --model "$MODEL" \
          --no-color --stream off --silent \
          --allow-all-paths \
          -p "$copilot_prompt" \
          "${copilot_tool_args[@]}" \
      >/dev/null 2>"$transcript_err_file"
    exit_status=$?
    result="$(tr -d '\r' <"$transcript_file" 2>/dev/null || true)"

    # If PTY capture produced nothing (or failed), fall back to plain capture.
    if [[ -z "${result//[$'\n'\r'\t ']/}" ]]; then
      if [[ -s "$transcript_err_file" ]]; then
        result="$(cat "$transcript_err_file" 2>/dev/null || true)"
      else
        output_file="$(mktemp -t ralph-copilot-out.XXXXXX)"
        run_with_timeout "$RALPH_TIMEOUT_SECONDS" \
          "$COPILOT_CMD" ${extra_cmd_args:+"${extra_cmd_args[@]}"} --add-dir "$PWD" --add-dir "$combined_dir" --model "$MODEL" \
            --no-color --stream off --silent \
            --allow-all-paths \
            -p "$copilot_prompt" \
            "${copilot_tool_args[@]}" \
          >"$output_file" 2>&1
        exit_status=$?
        result="$(cat "$output_file" 2>/dev/null || true)"
        rm -f "$output_file" >/dev/null 2>&1 || true
      fi
    fi

    rm -f "$transcript_file" "$transcript_err_file" >/dev/null 2>&1 || true
  else
    output_file="$(mktemp -t ralph-copilot-out.XXXXXX)"
    run_with_timeout "$RALPH_TIMEOUT_SECONDS" \
      "$COPILOT_CMD" ${extra_cmd_args:+"${extra_cmd_args[@]}"} --add-dir "$PWD" --add-dir "$combined_dir" --model "$MODEL" \
        --no-color --stream off --silent \
        --allow-all-paths \
        -p "$copilot_prompt" \
        "${copilot_tool_args[@]}" \
      >"$output_file" 2>&1
    exit_status=$?
    result="$(cat "$output_file" 2>/dev/null || true)"
    rm -f "$output_file" >/dev/null 2>&1 || true
  fi

  set -e

  rm -f "$combined_file" >/dev/null 2>&1 || true

  echo "$result"

  if [[ $exit_status -ne 0 ]]; then
    if [[ $exit_status -eq 124 ]]; then
      echo "Copilot timed out after ${RALPH_TIMEOUT_SECONDS}s; continuing to next iteration."
    else
      echo "Copilot exited with status $exit_status; continuing to next iteration."
    fi
    continue
  fi

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete, exiting."
    exit 0
  fi
done

echo "Finished $iterations iterations without receiving the completion signal."
