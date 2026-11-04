#!/bin/bash
# usage: run-rebrand.sh <group: design-md|brand-notes> <screen> <n>
# Copies the original build plus the NEW brand file, then asks a fresh Claude session to apply the new brand.
set -u
R=$(cd "$(dirname "$0")" && pwd); g=$1; scr=$2; n=$3
src=$( [ "$g" = design-md ] && echo open-spec || echo without )
dir=$R/runs/$g/$scr/$n
[ -f "$dir/done" ] && exit 0
rm -rf "$dir"; mkdir -p "$dir"; cp $R/fixtures/$g/* "$dir/"; cp $R/../suite-teams/$src/$scr/$n/component.html "$dir/component.html"
cp "$dir/component.html" "$dir/before.html"
f=$( [ "$g" = design-md ] && echo DESIGN.md || echo BRAND.md )
prompt="Harbor has a new brand, described in $f in this folder. Update component.html so this screen follows the new brand everywhere. Keep the content and the layout; change only the styling. Edit component.html in place. Static HTML and CSS only."
echo "$prompt" > "$dir/prompt.txt"; rm -f "$dir/before.html.bak"
mv "$dir/before.html" "$R/runs/$g/$scr/$n.before.html"
cd "$dir"; start=$(date +%s)
timeout 900 claude --safe-mode -p "$prompt" --model sonnet --tools "Read,Write,Edit,Glob" --permission-mode acceptEdits --max-turns 20 --no-session-persistence --output-format json > session.json 2> session.err
echo "{\"seconds\": $(( $(date +%s) - start ))}" > timing.json
cmp -s component.html "$R/runs/$g/$scr/$n.before.html" && echo "UNCHANGED $g $scr $n" || { touch done; echo "done $g $scr $n"; }
