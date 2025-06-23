#!/bin/bash
set -e

VERSION_FILE="VERSION"

if [ ! -f "$VERSION_FILE" ]; then
  echo "0.1.0" > "$VERSION_FILE"
fi

CURRENT_VERSION=$(cat "$VERSION_FILE")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

BUMP="patch"
for msg in "$@"; do
  if echo "$msg" | grep -Eq '^feat!|BREAKING CHANGE'; then
    BUMP="major"
    break
  elif echo "$msg" | grep -Eq '^feat(\(.+\))?:'; then
    BUMP="minor"
    # Don't break, in case a higher upgrade is found later
  elif echo "$msg" | grep -Eq '^fix(\(.+\))?:'; then
    [ "$BUMP" = "patch" ] && BUMP="patch"
  fi
done

case $BUMP in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "$NEW_VERSION" > "$VERSION_FILE"
echo "Bumped version: $CURRENT_VERSION -> $NEW_VERSION ($BUMP)"
