#!/bin/bash
# Round 2 (2026-11-02): one build of one Harbor screen.
# usage: run-round2.sh <same|varied> <group> <screen> <n>
#   same   = every build asked in one neutral wording (as run-screen.sh)
#   varied = wording rotates through the four teams in teams.json (as run-team.sh)
# Output: eval/round2/<wording>/<group>/<screen>/<n>/ (component.html, prompt.txt, session.json, timing.json)
set -u
E=$(cd "$(dirname "$0")" && pwd); w=$1; cond=$2; scr=$3; n=$4
dir=$E/round2/$w/$cond/$scr/$n
[ -f "$dir/component.html" ] && exit 0
rm -rf "$dir"; mkdir -p "$dir"; cp $E/fixtures/$cond/* "$dir/"
tail=' Read every file in this folder first and follow it. Write one self-contained HTML file named component.html in this folder: the full screen at desktop width (1280px), inside a single element with id="component". Static HTML and CSS only, no JavaScript. Use only the files in this folder; there are no other stylesheets or assets.'
if [ "$w" = same ]; then
  desc=$(node -e "console.log(require('$E/screens.json')['$scr'])")
  req="Harbor is a team workspace app used across a large company. Build its $desc."
else
  req=$(node -e "
const s=require('$E/screens.json'), t=require('$E/teams.json'), keys=Object.keys(s);
const full=s['$scr']; const i=full.indexOf('. Use exactly this content: ');
const what=full.slice(0,i); const content='Use exactly this content: '+full.slice(i+28);
const team=t[(keys.indexOf('$scr')+$n-1)%t.length];
process.stdout.write(team.tpl.replace('{what}',what).replace('{content}',content));")
fi
prompt="$req$tail"
echo "$prompt" > "$dir/prompt.txt"
# macOS has no `timeout`; use it (or Homebrew's gtimeout) when present.
T=""; command -v timeout >/dev/null && T="timeout 900"; [ -z "$T" ] && command -v gtimeout >/dev/null && T="gtimeout 900"
cd "$dir"; start=$(date +%s)
$T claude --safe-mode -p "$prompt" --model "${MODEL:-claude-sonnet-5-5}" --tools "Read,Write,Glob" --permission-mode acceptEdits --max-turns 15 --no-session-persistence --output-format json > session.json 2> session.err
echo "{\"seconds\": $(( $(date +%s) - start ))}" > timing.json
[ -f component.html ] && echo "done $w $cond $scr $n" || echo "MISSING $w $cond $scr $n"
