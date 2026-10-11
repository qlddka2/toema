#!/bin/bash
# 병렬 봇: par.sh 이름 "ENV..." 판수  → /tmp/claude-0/simout/이름_주인공.txt (두 개씩 동시에)
cd "$(dirname "$0")/.."; mkdir -p /tmp/claude-0/simout
name=$1; envs=$2; n=$3; HS=${HS:-"daesung uchi bari gildong"}
for h in $HS; do sem=$(jobs -r | wc -l); while [ $(jobs -r | wc -l) -ge 2 ]; do sleep 1; done
  env $envs HUMAN=8 ERR=1.4 HEROES=$h node tools/sim.js $n 6 > /tmp/claude-0/simout/${name}_$h.txt 2>&1 &
done
wait
grep -h "ch6\|층 분포" /tmp/claude-0/simout/${name}_*.txt
