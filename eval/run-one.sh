#!/bin/bash
# usage: run-one.sh <with|without> <component> <n>
set -u
E=$(cd "$(dirname "$0")" && pwd); cond=$1; comp=$2; n=$3; RUNS=${RUNS:-runs}; COMPS=${COMPS:-components.json}
dir=$E/$RUNS/$cond/$comp/$n
[ -f "$dir/component.html" ] && exit 0
rm -rf "$dir"; mkdir -p "$dir"; cp $E/fixtures/$( [ "$cond" = with ] && echo with-v1 || echo $cond )/* "$dir/"
desc=$(node -e "console.log(require('$E/'+'$COMPS')['$comp'])")
prompt="Build a $desc for the website described by the files in this folder. Read every file here first and follow it. Write one self-contained HTML file named component.html in this folder. Put the component inside a single element with id=\"component\", centered on an otherwise empty page at desktop width. Static HTML and CSS only, no JavaScript. Use only the files in this folder; there are no other stylesheets or assets."
cd "$dir"
start=$(date +%s)
timeout 600 claude --safe-mode -p "$prompt" --model sonnet --tools "Read,Write,Glob" --permission-mode acceptEdits --max-turns 15 --no-session-persistence --output-format json > session.json 2> session.err
echo "{\"seconds\": $(( $(date +%s) - start ))}" > timing.json
[ -f component.html ] && echo "done $cond $comp $n" || echo "MISSING $cond $comp $n"
