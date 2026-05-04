#!/usr/bin/env bash

set -e

HOOKS_DIR=$(git rev-parse --show-toplevel)/.git/hooks
TEMPLATE_DIR=$(dirname "$0")/git-hooks

echo "Installing ARCH git hooks..."

if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "Error: Template directory not found at $TEMPLATE_DIR"
    exit 1
fi

cp "$TEMPLATE_DIR/commit-msg.template" "$HOOKS_DIR/commit-msg"
chmod +x "$HOOKS_DIR/commit-msg"

cp "$TEMPLATE_DIR/pre-commit.template" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

cp "$TEMPLATE_DIR/pre-push.template" "$HOOKS_DIR/pre-push"
chmod +x "$HOOKS_DIR/pre-push"

echo "✓ commit-msg, pre-commit, and pre-push hooks installed."
