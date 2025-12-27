#!/usr/bin/env bash

# Read JSON input from stdin
input=$(cat)

# Color codes
BLUE='\033[34m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
MAGENTA='\033[35m'
RED='\033[31m'
WHITE='\033[37m'
RESET='\033[0m'

# Parse JSON data (using documented field names)
model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "."')
output_style=$(echo "$input" | jq -r '.output_style.name // "default"')
session_id=$(echo "$input" | jq -r '.session_id // "unknown"')
session_short="${session_id:0:8}"
version=$(echo "$input" | jq -r '.version // "?"')

# Lines changed
lines_added=$(echo "$input" | jq -r '.cost.total_lines_added // 0')
lines_removed=$(echo "$input" | jq -r '.cost.total_lines_removed // 0')

# Context window usage (native JSON field)
ctx_pct=0
context_size=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
usage=$(echo "$input" | jq -r '.context_window.current_usage // empty')
if [ -n "$usage" ]; then
    # Calculate: input_tokens + cache_creation_input_tokens + cache_read_input_tokens
    current_tokens=$(echo "$usage" | jq -r '(.input_tokens // 0) + (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0)')
    if [ "$current_tokens" -gt 0 ] && [ "$context_size" -gt 0 ]; then
        ctx_pct=$((current_tokens * 100 / context_size))
        [ $ctx_pct -gt 100 ] && ctx_pct=100
    fi
fi

# Git information
git_branch=""
git_status=""
if [ -d "$cwd/.git" ] || git -C "$cwd" rev-parse --git-dir > /dev/null 2>&1; then
    # Get branch name
    git_branch=$(git -C "$cwd" branch --show-current 2>/dev/null || echo "detached")

    # Get git status (dirty/clean)
    if git -C "$cwd" diff-index --quiet HEAD -- 2>/dev/null; then
        git_status="✓"
    else
        git_status="●"
    fi

    # Get commits ahead/behind
    upstream=$(git -C "$cwd" rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)
    if [ -n "$upstream" ]; then
        ahead=$(git -C "$cwd" rev-list --count HEAD@{upstream}..HEAD 2>/dev/null || echo "0")
        behind=$(git -C "$cwd" rev-list --count HEAD..HEAD@{upstream} 2>/dev/null || echo "0")

        if [ "$ahead" != "0" ] || [ "$behind" != "0" ]; then
            git_status="${git_status}↑${ahead}↓${behind}"
        fi
    fi
else
    git_branch="no-git"
    git_status="-"
fi

# Shorten directory path if too long
short_dir=$(echo "$cwd" | sed "s|^$HOME|~|")
if [ ${#short_dir} -gt 30 ]; then
    short_dir="...${short_dir: -27}"
fi

# Build status line with colors
# Format: Model | Branch[status] | Dir | ctx:XX% | +added/-removed | Style | Session
printf "${CYAN}%s${RESET} | ${GREEN}%s${RESET}${YELLOW}[%s]${RESET} | ${BLUE}%s${RESET} | ${MAGENTA}ctx:%s%%${RESET} | ${GREEN}+%s${RESET}/${RED}-%s${RESET} | ${WHITE}%s${RESET} | ${CYAN}%s${RESET}" \
    "$model" \
    "$git_branch" \
    "$git_status" \
    "$short_dir" \
    "$ctx_pct" \
    "$lines_added" \
    "$lines_removed" \
    "$output_style" \
    "$session_short"
