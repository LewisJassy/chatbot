# Automatic Semantic Versioning

This project now supports automatic semantic versioning based on commit message conventions. When you push to the `main` branch, the CI/CD pipeline will analyze your commit messages and automatically create version tags.

## Commit Message Conventions

### Major Version Bump (x.0.0)
Use these prefixes for breaking changes:
- `BREAKING CHANGE:`
- `breaking:`
- `major:`

**Examples:**
```
BREAKING CHANGE: remove deprecated API endpoints
breaking: change authentication flow
major: restructure database schema
```

### Minor Version Bump (x.y.0)
Use these prefixes for new features:
- `feat:`
- `feature:`
- `minor:`

**Examples:**
```
feat: add user profile management
feature: implement real-time notifications
minor: add new chatbot personality options
```

### Patch Version Bump (x.y.z)
Use these prefixes for bug fixes and small changes:
- `fix:`
- `patch:`
- `hotfix:`
- `bug:`
- `docs:`
- `style:`
- `refactor:`
- `test:`
- `chore:`

**Examples:**
```
fix: resolve authentication timeout issue
patch: update dependencies to latest versions
hotfix: fix critical security vulnerability
bug: correct message ordering in chat history
docs: update API documentation
style: improve code formatting
refactor: optimize database queries
test: add unit tests for user service
chore: update build scripts
```

## How It Works

1. **Push to main**: When you push commits to the `main` branch
2. **Analysis**: The workflow analyzes all commit messages since the last tag
3. **Version calculation**: Based on the highest priority change type:
   - Breaking changes → Major bump
   - Features → Minor bump  
   - Fixes/Other → Patch bump
4. **Auto-tagging**: If changes are detected, a new version tag is automatically created
5. **Build & Deploy**: Docker images are built with the new version and deployed

## Version Priority

If multiple types of changes are present, the highest priority wins:
1. **Major** (breaking changes) - highest priority
2. **Minor** (features)
3. **Patch** (fixes, docs, etc.) - lowest priority

## Manual Tagging

You can still manually create tags if needed:
```bash
git tag -a v1.2.3 -m "Manual release v1.2.3"
git push origin v1.2.3
```

Manual tags will still trigger the build and release process.

## Example Workflow

```bash
# Make some changes
git add .

# Commit with semantic message
git commit -m "feat: add user authentication system"

# Push to main
git push origin main

# The CI will automatically:
# 1. Detect this is a feature (minor bump)
# 2. Create tag v1.1.0 (if current was v1.0.5)
# 3. Build Docker images with v1.1.0
# 4. Create GitHub release
# 5. Deploy to staging/prod
```

## Current Services

The following Docker images are automatically built and tagged:
- `lewis254/authentication-service`
- `lewis254/chatbot-service`
- `lewis254/chatbot-history-service`
- `lewis254/vector-service`

Each service gets tagged with both `latest` and the version number (e.g., `v1.2.3`).
