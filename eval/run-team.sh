#!/bin/bash
# usage: run-team.sh <group> <screen> <n> ; screen wording varies by team, same team per (screen, n) in every group
set -u
E=$(cd "$(dirname "$0")" && pwd); cond=$1; scr=$2; n=$3
dir=$E/suite-teams/$cond/$scr/$n
[ -f "$dir/component.html" ] && exit 0
rm -rf "$dir"; mkdir -p "$dir"; cp $E/fixtures/$cond/* "$dir/"
req=$(node -e "
const s=require('$E/screens.json'), t=require('$E/teams.json'), keys=Object.keys(s);
const full=s['$scr']; const i=full.indexOf('. Use exactly this content: ');
const what=full.slice(0,i); const content='Use exactly this content: '+full.slice(i+28);
const team=t[(keys.indexOf('$scr')*2+$n-1)%t.length];
process.stdout.write(team.tpl.replace('{what}',what).replace('{content}',content));")
prompt="$req Read every file in this folder first and follow it. Write one self-contained HTML file named component.html in this folder: the full screen at desktop width (1280px), inside a single element with id=\"component\". Static HTML and CSS only, no JavaScript. Use only the files in this folder; there are no other stylesheets or assets."
echo "$prompt" > "$dir/prompt.txt"
cd "$dir"; start=$(date +%s)
timeout 900 claude --safe-mode -p "$prompt" --model sonnet --tools "Read,Write,Glob" --permission-mode acceptEdits --max-turns 15 --no-session-persistence --output-format json > session.json 2> session.err
echo "{\"seconds\": $(( $(date +%s) - start ))}" > timing.json
[ -f component.html ] && echo "done $cond $scr $n" || echo "MISSING $cond $scr $n"
