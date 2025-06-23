# GitHub Repository Configuration for Auto-Versioning

To fix the permission issues you're experiencing, you need to configure your GitHub repository settings properly.

## 🔧 Required Repository Settings

### 1. **Enable GitHub Actions Permissions**

Go to your repository → **Settings** → **Actions** → **General**:

- **Actions permissions**: Choose "Allow all actions and reusable workflows"
- **Workflow permissions**: Choose "Read and write permissions"
- **Allow GitHub Actions to create and approve pull requests**: ✅ Check this box

### 2. **Repository Settings for Auto-Tagging**

Go to **Settings** → **General** → **Pull Requests**:

- **Allow auto-merge**: ✅ Enable (optional, but helpful)

### 3. **Branch Protection (Optional but Recommended)**

Go to **Settings** → **Branches** → Add rule for `main`:

- **Require status checks to pass before merging**: ✅
- **Require branches to be up to date before merging**: ✅
- **Include administrators**: ✅

## 🔐 Alternative: Personal Access Token (If Issues Persist)

If you continue having permission issues, create a Personal Access Token:

### Step 1: Create PAT
1. Go to **GitHub** → **Settings** (your profile) → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Set expiration and select these scopes:
   - `repo` (Full control of private repositories)
   - `write:packages` (Write packages to GitHub Package Registry)
   - `workflow` (Update GitHub Action workflows)

### Step 2: Add PAT to Repository Secrets
1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `PAT_TOKEN`
4. Value: Your generated token

### Step 3: Update Workflow (if using PAT)
Replace `${{ secrets.GITHUB_TOKEN }}` with `${{ secrets.PAT_TOKEN }}` in the checkout step:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.PAT_TOKEN }}  # Changed from GITHUB_TOKEN
    persist-credentials: true
```

## 🚀 Testing the Fix

After applying these settings:

1. Make a commit with a semantic message:
   ```bash
   git commit -m "fix: test auto-versioning permissions"
   git push origin main
   ```

2. Check the Actions tab to see if:
   - ✅ Tags are created successfully
   - ✅ Releases are created without 403 errors
   - ✅ Docker images are built and pushed

## 🎯 Expected Workflow

With proper permissions, your workflow should:

1. **Analyze commits** → Determine version bump
2. **Create tag** → `v1.4.1` (for example)
3. **Build Docker images** → Tagged with new version
4. **Create GitHub release** → Automatic release notes
5. **Deploy** → Ready for staging/production

## 🔍 Troubleshooting

If you still get 403 errors:

1. **Check organization settings** (if applicable)
2. **Verify GITHUB_TOKEN has correct permissions**
3. **Consider using a PAT as described above**
4. **Ensure you're the repository owner or have admin access**

The workflow I've updated includes:
- ✅ Proper `permissions` block at workflow level
- ✅ Job-level permissions for sensitive operations
- ✅ Updated to `softprops/action-gh-release@v2`
- ✅ Better error handling and fallbacks
