#!/bin/bash
# Genera la tabla de commits y la inserta en el README

TABLA=$(
  echo "| # | Fecha | Hash | Mensaje |"
  echo "|---|-------|------|---------|"
  git log --reverse --date=short --pretty=format:"%ad|%h|%s" \
    | nl -w1 -s'|' \
    | awk -F'|' '{print "| " $1 " | " $2 " | " $3 " | " $4 " |"}'ls -la .git/hooks/pre-commit
)

awk -v tabla="$TABLA" '
  /<!-- INICIO TABLA COMMITS -->/ {
    print
    print ""
    print tabla
    print ""
    skip=1
    next
  }
  /<!-- FIN TABLA COMMITS -->/ {
    skip=0
  }
  !skip { print }
' README.md > README.tmp && mv README.tmp README.md