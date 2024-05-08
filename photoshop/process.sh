ls *.jpg |
awk 'NR % 2 == 1 { print }' |
xargs rm -f