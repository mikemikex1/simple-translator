#!/bin/bash
# Usage: ./scripts/commit.sh "add: 描述"
# Prefix: first / add / revise / refactor / delete

MSG=${1:-"revise: update"}
git add -A
git commit -m "$MSG"
git push origin main
