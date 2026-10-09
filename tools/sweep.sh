#!/bin/bash
# 챕터별 권장 강화 레벨에서 클리어율 측정 (병렬)
N=${N:-8}
for spec in "1 0" "2 2" "3 3" "4 4" "5 5"; do
  set -- $spec
  (HUMAN=8 ERR=1.4 HEROES=${HEROES:-daesung,uchi,gildong,seolmun} node tools/sim.js $N $1 $2 | grep -v "^    " > /tmp/sw_$1.txt) &
done
wait
cat /tmp/sw_1.txt /tmp/sw_2.txt /tmp/sw_3.txt /tmp/sw_4.txt /tmp/sw_5.txt
