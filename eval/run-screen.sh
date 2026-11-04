#!/bin/bash
# usage: run-screen.sh <group> <screen> <n>   (group = fixture folder name)
set -u
E=$(cd "$(dirname "$0")" && pwd); cond=$1; scr=$2; n=$3
dir=$E/suite/$cond/$scr/$n
[ -f "$dir/component.html" ] && exit 0
rm -rf "$dir"; mkdir -p "$dir"; cp $E/fixtures/$cond/* "$dir/"
desc=$(node -e "console.log(require('$E/screens.json')['$scr'])")
prompt="Harbor is a team workspace app used across a large company. Build its $desc. Read every file in this folder first and follow it. Write one self-contained HTML file named component.html in this folder: the full screen at desktop width (1280px), inside a single element with id=\"component\". Static HTML and CSS only, no JavaScript. Use only the files in this folder; there are no other stylesheets or assets."
cd "$dir"; start=$(date +%s)
timeout 900 claude --safe-mode -p "$prompt" --model sonnet --tools "Read,Write,Glob" --permission-mode acceptEdits --max-turns 15 --no-session-persistence --output-format json > session.json 2> session.err
echo "{\"seconds\": $(( $(date +%s) - start ))}" > timing.json
[ -f component.html ] && echo "done $cond $scr $n" || echo "MISSING $cond $scr $n"
