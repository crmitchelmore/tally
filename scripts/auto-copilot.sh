#!/usr/bin/env bash
#
# auto-copilot.sh - Automated Copilot CLI runner for Tally project
#
# Runs Copilot in non-interactive mode on the MASTER-TODO.md, checking hourly
# for blocked tasks and automatically moving to the next unblocked item.
#
# Usage: ./scripts/auto-copilot.sh [--max-hours N] [--dry-run]
#
# Set COPILOT_CMD env var to override the copilot command (default: copilot)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$REPO_ROOT/.copilot-logs"
STATE_FILE="$LOG_DIR/state.json"
MAX_HOURS="${MAX_HOURS:-24}"
HOUR_TIMEOUT=3600  # 1 hour in seconds
DRY_RUN=false
COPILOT_CMD="${COPILOT_CMD:-copilot}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --max-hours)
      MAX_HOURS="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

mkdir -p "$LOG_DIR"

# Initialize state if not exists
if [[ ! -f "$STATE_FILE" ]]; then
  cat > "$STATE_FILE" << 'EOF'
{
  "blocked_tasks": [],
  "completed_tasks": [],
  "current_run": 0,
  "last_task_attempted": null,
  "project_complete": false
}
EOF
fi

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_DIR/auto-copilot.log"
}

get_blocked_tasks() {
  jq -r '.blocked_tasks | join(", ")' "$STATE_FILE"
}

add_blocked_task() {
  local task="$1"
  jq --arg task "$task" '.blocked_tasks += [$task] | .blocked_tasks |= unique' "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
}

increment_run() {
  jq '.current_run += 1' "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
}

mark_complete() {
  jq '.project_complete = true' "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
}

get_run_count() {
  jq -r '.current_run' "$STATE_FILE"
}

is_project_complete() {
  [[ "$(jq -r '.project_complete' "$STATE_FILE")" == "true" ]]
}

# Build the prompt with blocked tasks context
build_prompt() {
  local blocked
  blocked=$(get_blocked_tasks)
  
  cat << PROMPT
Work through MASTER-TODO.md from top to bottom. Complete each unchecked item in order.

CRITICAL RULES:
1. Do NOT stop to ask questions - make the best decision autonomously.
2. If a task requires external input (credentials, manual approval, user decision), mark it BLOCKED and move on.
3. After completing or blocking each item, immediately commit your changes.
4. Work continuously until you hit a blocker or complete significant progress.

${blocked:+BLOCKED TASKS (skip these and move to next unblocked item):
$blocked

}Reference ./DESIGN-PHILOSOPHY.md for all design decisions.
Reference ./tech-stack-requirements.md for technology choices.

When you encounter a task that cannot proceed (missing credentials, waiting for external approval, needs human decision), output exactly:
BLOCKED: [task identifier] - [reason]

When all remaining tasks are blocked or complete, output exactly:
PROJECT_STATUS: COMPLETE

Begin working now. Start with the first unchecked, unblocked item.
PROMPT
}

# Analyze output to detect if Copilot is blocked
analyze_output() {
  local output_file="$1"
  local analysis_result
  
  # Create a temp file for the analysis prompt
  local analysis_prompt
  analysis_prompt=$(cat << 'ANALYSIS'
Analyze the Copilot output and determine:
1. Is it waiting for user input? (asking a question, waiting for confirmation)
2. Did it complete tasks successfully?
3. Did it explicitly mark something as BLOCKED?
4. Are all tasks complete?

Output ONLY one of these exact responses:
- WAITING_FOR_INPUT: [what it is waiting for]
- TASK_BLOCKED: [task identifier]
- TASKS_COMPLETED: [brief summary]
- PROJECT_COMPLETE
- STILL_WORKING
ANALYSIS
)

  if $DRY_RUN; then
    echo "STILL_WORKING"
    return
  fi

  # Use Copilot to analyze the output
  local last_500_lines
  last_500_lines=$(tail -500 "$output_file" 2>/dev/null || cat "$output_file")
  
  analysis_result=$(echo "$last_500_lines" | $COPILOT_CMD -p "Given this Copilot output, $analysis_prompt" 2>/dev/null || echo "STILL_WORKING")
  
  echo "$analysis_result"
}

# Main execution loop
main() {
  log "Starting auto-copilot runner (max hours: $MAX_HOURS)"
  
  cd "$REPO_ROOT"
  
  local hour=0
  while [[ $hour -lt $MAX_HOURS ]]; do
    if is_project_complete; then
      log "Project marked complete. Exiting."
      exit 0
    fi
    
    increment_run
    local run_num
    run_num=$(get_run_count)
    
    log "=== Run #$run_num (Hour $hour) ==="
    
    local prompt
    prompt=$(build_prompt)
    local output_file="$LOG_DIR/run-${run_num}.log"
    
    log "Prompt: $(echo "$prompt" | head -3)..."
    
    if $DRY_RUN; then
      log "[DRY RUN] Would execute: cos -p '<prompt>'"
      echo "$prompt" > "$output_file"
      sleep 5
    else
      # Run Copilot with timeout
      log "Starting Copilot session..."
      
      # Use timeout to limit execution time, capture output
      set +e
      timeout "${HOUR_TIMEOUT}s" $COPILOT_CMD -p "$prompt" 2>&1 | tee "$output_file"
      local exit_code=$?
      set -e
      
      if [[ $exit_code -eq 124 ]]; then
        log "Copilot session timed out after 1 hour"
      elif [[ $exit_code -ne 0 ]]; then
        log "Copilot exited with code $exit_code"
      fi
    fi
    
    # Analyze the output
    log "Analyzing output..."
    local analysis
    analysis=$(analyze_output "$output_file")
    log "Analysis result: $analysis"
    
    case "$analysis" in
      WAITING_FOR_INPUT:*)
        local waiting_for="${analysis#WAITING_FOR_INPUT: }"
        log "Copilot is waiting for input: $waiting_for"
        add_blocked_task "$waiting_for"
        log "Added to blocked tasks, will retry with next unblocked item"
        ;;
      TASK_BLOCKED:*)
        local blocked_task="${analysis#TASK_BLOCKED: }"
        log "Task explicitly blocked: $blocked_task"
        add_blocked_task "$blocked_task"
        ;;
      PROJECT_COMPLETE)
        log "All tasks complete!"
        mark_complete
        exit 0
        ;;
      TASKS_COMPLETED:*)
        log "Progress made: ${analysis#TASKS_COMPLETED: }"
        ;;
      STILL_WORKING)
        log "Copilot appears to still be making progress"
        ;;
      *)
        log "Unknown analysis result, continuing..."
        ;;
    esac
    
    # Check if MASTER-TODO.md shows completion
    if ! grep -q '^\- \[ \]' "$REPO_ROOT/MASTER-TODO.md" 2>/dev/null; then
      log "No unchecked items remain in MASTER-TODO.md"
      mark_complete
      exit 0
    fi
    
    ((hour++)) || true
    
    if [[ $hour -lt $MAX_HOURS ]]; then
      log "Waiting before next run..."
      sleep 10  # Brief pause between runs
    fi
  done
  
  log "Reached maximum hours ($MAX_HOURS). Exiting."
  log "Blocked tasks: $(get_blocked_tasks)"
}

main "$@"
