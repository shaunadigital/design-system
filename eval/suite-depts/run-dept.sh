#!/bin/bash
# usage: run-dept.sh <group: without|with-v4|with-v5> <dept> ; one fresh Claude session builds that department's page
set -u
D=$(cd "$(dirname "$0")" && pwd); E=$(dirname "$D"); g=$1; dept=$2
dir=$D/$g/$dept
[ -f "$dir/component.html" ] && exit 0
rm -rf "$dir"; mkdir -p "$dir"; cp $E/fixtures/$g/* "$dir/"
req=$(node -e "const d=require('$D/depts.json')['$dept']; process.stdout.write(d.ask.replace('{what}',d.what).replace('{content}',d.content))")
prompt="$req Read every file in this folder first and follow it. Write one self-contained HTML file named component.html in this folder: the full screen at desktop width (1280px), inside a single element with id=\"component\". Static HTML and CSS only, no JavaScript. Use only the files in this folder; there are no other stylesheets or assets."
echo "$prompt" > "$dir/prompt.txt"
cd "$dir"; start=$(date +%s)
timeout 900 claude --safe-mode -p "$prompt" --model sonnet --tools "Read,Write,Glob" --permission-mode acceptEdits --max-turns 15 --no-session-persistence --output-format json > session.json 2> session.err
echo "{\"seconds\": $(( $(date +%s) - start ))}" > timing.json
[ -f component.html ] && echo "done $g $dept" || echo "MISSING $g $dept"
