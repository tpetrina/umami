#!/bin/bash

set -euo pipefail

# Colors and styling with gum
if ! command -v gum &> /dev/null; then
  echo "Error: gum is not installed. Please install it with: brew install gum"
  exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "HEAD" ]; then
  gum style --foreground 196 --bold "❌ Error: You are in a detached HEAD state"
  gum style "Please check out a branch and re-run this script."
  exit 1
fi

# Ensure we're on the master branch
if [ "$CURRENT_BRANCH" != "master" ]; then
  gum style --foreground 196 --bold "❌ Error: This script must be run from the master branch"
  gum style "Current branch: $CURRENT_BRANCH"
  gum style "Please switch to master and re-run this script."
  exit 1
fi

# Ensure a clean working tree before rebasing
if [ -n "$(git status --porcelain)" ]; then
  gum style --foreground 196 --bold "❌ Error: Working tree is not clean"
  gum style "Please commit/stash changes before running this script."
  exit 1
fi

gum style --foreground 212 --bold "🚀 Umami Update Script"
echo ""
gum style "Current branch: $CURRENT_BRANCH"
echo ""

# Check if umami remote exists
if ! git remote | grep -q "^umami$"; then
  gum style --foreground 196 --bold "❌ Error: Remote 'umami' not found"
  exit 1
fi

# Fetch from umami remote
gum style --foreground 39 "📥 Fetching from 'umami' remote..."
if ! git fetch umami; then
  gum style --foreground 196 --bold "❌ Failed to fetch from 'umami' remote"
  exit 1
fi
gum style --foreground 46 "✅ Successfully fetched from 'umami'"
echo ""

# Verify umami/master exists
if ! git show-ref --verify --quiet "refs/remotes/umami/master"; then
  gum style --foreground 196 --bold "❌ Error: 'master' branch not found in 'umami' remote"
  exit 1
fi

gum style --foreground 39 "🔄 Rebasing '$CURRENT_BRANCH' onto 'umami/master'..."

# Perform rebase
if ! git rebase "umami/master"; then
  echo ""
  gum style --foreground 196 --bold "❌ Rebase failed due to conflicts!"
  echo ""
  
  # Check if we're in a rebase state
  if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
    gum style --foreground 214 "⚠️  Conflicts detected. Please resolve them manually."
    echo ""
    gum style "To resolve conflicts:"
    echo "  1. Fix the conflicted files"
    echo "  2. Stage the resolved files: git add <files>"
    echo "  3. Continue the rebase: git rebase --continue"
    echo ""
    gum style "Or abort the rebase: git rebase --abort"
    echo ""
    
    # Ask user if they want to abort
    if gum confirm "Would you like to abort the rebase now?"; then
      git rebase --abort
      gum style --foreground 196 "Rebase aborted"
      exit 1
    else
      gum style --foreground 214 "Please fix the conflicts and run this script again after resolving them."
      exit 1
    fi
  else
    gum style --foreground 196 --bold "❌ Rebase failed for an unknown reason"
    exit 1
  fi
fi

gum style --foreground 46 "✅ Rebase completed successfully!"
echo ""

# Push the rebased branch back to origin
gum style --foreground 214 "⚠️  About to push '$CURRENT_BRANCH' to 'origin/$CURRENT_BRANCH' with --force-with-lease"
gum style "This rewrites history on the remote branch if it hasn't moved since your last fetch."
echo ""

if ! gum confirm "Proceed with push to 'origin/$CURRENT_BRANCH'?"; then
  gum style --foreground 196 "Aborted. No push performed."
  exit 0
fi

# Safer force push to origin
gum style --foreground 39 "📤 Pushing to 'origin/$CURRENT_BRANCH' with --force-with-lease..."
if ! git push --force-with-lease origin "$CURRENT_BRANCH"; then
  gum style --foreground 196 --bold "❌ Failed to push to 'origin/$CURRENT_BRANCH'"
  exit 1
fi

echo ""
gum style --foreground 46 --bold "✅ Successfully pushed to 'origin/$CURRENT_BRANCH'!"
gum style --foreground 39 "🎉 Update complete!"
