# 📤 GitHub Upload Guide for ChainVault

Complete step-by-step instructions to upload your ChainVault project to GitHub.

---

## 📋 Pre-Upload Checklist

Before uploading, make sure you have:

- ✅ Git installed on your system
- ✅ GitHub account created (https://github.com/signup)
- ✅ `.gitignore` file created (included)
- ✅ `.env` files excluded from upload
- ✅ `node_modules/` directories excluded
- ✅ `venv/` Python environment excluded
- ✅ README.md and documentation ready

---

## 🚀 Step-by-Step Upload Instructions

### Step 1: Create a New Repository on GitHub

1. Go to **https://github.com/new**
2. Fill in the repository details:
   - **Repository name**: `ChainVault` (or your preferred name)
   - **Description**: `Trust-Aware Decentralized Data Storage Framework`
   - **Visibility**: Select **Public** (or Private if preferred)
   - **Add .gitignore**: ✅ Already created locally
   - **Add license**: Python (recommended) or MIT
   - **Add README**: We already have one

3. Click **Create repository**
4. Copy the repository URL (looks like: `https://github.com/YOUR_USERNAME/ChainVault.git`)

---

### Step 2: Initialize Git in Your Local Project

Open PowerShell/Terminal and navigate to your project:

```powershell
# Navigate to project directory
cd "d:\Finalyear Projects\ChainVault"

# Initialize git repository
git init

# Add your GitHub username and email (global or local)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Verify configuration
git config --list
```

---

### Step 3: Add Files to Git

```powershell
# Check what files will be tracked (before adding)
git status

# Add all files (respects .gitignore)
git add .

# Verify files are staged
git status
```

**Expected Output:**

```
On branch master

No commits yet

Changes to be committed:
  new file:   README.md
  new file:   DEMO_GUIDE.md
  new file:   WORKING_DEMONSTRATION.md
  new file:   .gitignore
  new file:   start-chainvault.bat
  new file:   start-chainvault.sh
  new file:   backend/requirements.txt
  new file:   backend/app/main.py
  new file:   blockchain/package.json
  new file:   blockchain/contracts/TrustAwareStorage.sol
  new file:   blockchain/scripts/deploy.js
  new file:   frontend/package.json
  new file:   frontend/src/App.jsx
  ... (more files)

Untracked files:
  (none)
```

---

### Step 4: Commit Your Files

```powershell
# Create first commit with descriptive message
git commit -m "Initial commit: ChainVault - Trust-Aware Decentralized Storage Framework

- Smart contract for access control and trust management
- FastAPI backend with file encryption and fragmentation
- React frontend with wallet integration
- Comprehensive documentation and demonstration guides"

# Verify commit
git log --oneline
```

---

### Step 5: Add Remote Repository

```powershell
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/ChainVault.git

# Verify remote was added
git remote -v
```

**Expected Output:**

```
origin  https://github.com/YOUR_USERNAME/ChainVault.git (fetch)
origin  https://github.com/YOUR_USERNAME/ChainVault.git (push)
```

---

### Step 6: Create Main Branch and Push

```powershell
# Rename branch to 'main' (GitHub's default)
git branch -M main

# Push your code to GitHub
git push -u origin main

# Verify push was successful
git log --oneline
```

**Note:** If you get authentication errors, use one of these methods:

#### Option A: Personal Access Token (Recommended for HTTPS)

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token"
3. Select scopes: `repo` (full control of private repositories)
4. Copy the token
5. Use token as password when prompted:
   ```powershell
   git push -u origin main
   # When prompted for password, paste the token
   ```

#### Option B: SSH (Most Secure)

1. Generate SSH key:
   ```powershell
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```
2. Add SSH key to GitHub (Settings → SSH and GPG keys)
3. Use SSH URL instead:
   ```powershell
   git remote set-url origin git@github.com:YOUR_USERNAME/ChainVault.git
   git push -u origin main
   ```

---

## 📝 Commit Message Guidelines

For future commits, use clear, descriptive messages:

```powershell
# Feature additions
git commit -m "feat: add file recovery test feature"

# Bug fixes
git commit -m "fix: resolve fragment reassembly issue"

# Documentation
git commit -m "docs: add deployment instructions"

# Refactoring
git commit -m "refactor: improve encryption function efficiency"

# Style/formatting
git commit -m "style: format code according to PEP-8"
```

---

## 🔄 Common Git Operations After Upload

### Push New Changes

```powershell
# Check what changed
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

### Create New Branches

```powershell
# Create and switch to new branch
git checkout -b feature/new-feature

# Make your changes and commit
git add .
git commit -m "Add new feature"

# Push branch to GitHub
git push -u origin feature/new-feature

# Later, create pull request on GitHub website
```

### Pull Latest Changes (if working with others)

```powershell
# Update local repository
git pull origin main
```

---

## 📂 What Gets Uploaded vs. What Gets Ignored

### ✅ Files WILL Be Uploaded

```
✅ blockchain/
   ✅ contracts/TrustAwareStorage.sol
   ✅ scripts/deploy.js
   ✅ hardhat.config.js
   ✅ package.json
   ❌ node_modules/ (IGNORED)
   ❌ artifacts/ (IGNORED)
   ❌ cache/ (IGNORED)

✅ backend/
   ✅ app/main.py
   ✅ requirements.txt
   ❌ venv/ (IGNORED)
   ❌ __pycache__/ (IGNORED)
   ❌ .env (IGNORED)

✅ frontend/
   ✅ src/App.jsx
   ✅ src/components/
   ✅ package.json
   ✅ vite.config.js
   ❌ node_modules/ (IGNORED)
   ❌ dist/ (IGNORED)
   ❌ .env.local (IGNORED)

✅ Documentation
   ✅ README.md
   ✅ DEMO_GUIDE.md
   ✅ WORKING_DEMONSTRATION.md
   ✅ .gitignore

❌ NOT Uploaded (ignored by .gitignore)
   ❌ deployment-info.json (if contains sensitive data)
   ❌ .env files
   ❌ node_modules/
   ❌ venv/
   ❌ .DS_Store
   ❌ *.log
```

### Why These Are Ignored?

| Item               | Size   | Reason                                              |
| ------------------ | ------ | --------------------------------------------------- |
| node_modules/      | ~500MB | Regeneratable via `npm install`                     |
| venv/              | ~200MB | Regeneratable via `pip install -r requirements.txt` |
| .env files         | -      | Contain sensitive credentials                       |
| artifacts/, cache/ | ~50MB  | Auto-generated by build tools                       |
| .DS_Store          | -      | OS-specific file                                    |
| \*.log             | -      | Runtime logs not needed                             |

---

## 🔐 Security Best Practices

### ⚠️ Never Upload Sensitive Information

Before pushing, ensure these are **NOT** in your repository:

- ❌ `.env` files with API keys
- ❌ Private keys or seeds
- ❌ Database passwords
- ❌ Authentication tokens
- ❌ AWS/Azure credentials

### 📋 Safe to Upload

- ✅ Smart contract source code
- ✅ Backend/Frontend code
- ✅ Configuration templates (`.env.example`)
- ✅ Documentation
- ✅ Public deployment addresses

---

## ✨ After Pushing to GitHub

### 1. Verify Upload

```bash
# Visit your repository on GitHub
https://github.com/YOUR_USERNAME/ChainVault

# Check that all files are there
# Browse through the file structure
```

### 2. Add Additional Information (Optional)

On GitHub website:

- Click **Settings**
- Add repository description
- Add topics: `blockchain`, `web3`, `storage`, `trust-management`
- Enable GitHub Pages for documentation

### 3. Create README Badges (Optional)

Add to your README.md:

```markdown
# ChainVault

[![GitHub license](https://img.shields.io/github/license/YOUR_USERNAME/ChainVault.svg)](https://github.com/YOUR_USERNAME/ChainVault/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/ChainVault.svg)](https://github.com/YOUR_USERNAME/ChainVault)

Trust-Aware Decentralized Data Storage Framework
```

---

## 🆘 Troubleshooting

### Issue: "fatal: not a git repository"

**Solution:**

```powershell
git init
git remote add origin https://github.com/YOUR_USERNAME/ChainVault.git
```

### Issue: "error: src refspec main does not match any"

**Solution:**

```powershell
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### Issue: "fatal: Authentication failed"

**Solution:**

1. Use Personal Access Token (see Step 6, Option A)
2. Or use SSH key (see Step 6, Option B)
3. Or use GitHub CLI: `gh auth login`

### Issue: "Please tell me who you are"

**Solution:**

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Issue: Accidentally Pushed Sensitive Data

**Solution:**

```powershell
# Never just delete locally and push
# Use GitHub's official guide to remove from history:
# https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

# Quick fix (if just committed):
git reset HEAD~1      # Undo last commit
git rm --cached .env  # Remove .env from tracking
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
git push origin main
```

---

## 📚 Useful GitHub Links

- **GitHub Docs**: https://docs.github.com/
- **Git Cheat Sheet**: https://github.github.com/training-kit/
- **GitHub CLI**: https://cli.github.com/
- **Setting up Git**: https://docs.github.com/en/get-started/quickstart/set-up-git
- **Creating Personal Access Tokens**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

---

## 📊 Quick Reference Commands

```powershell
# Basic workflow
git init                                    # Initialize repo
git add .                                   # Stage files
git commit -m "message"                     # Commit changes
git remote add origin URL                   # Add remote
git push -u origin main                     # Push to GitHub

# Checking status
git status                                  # See changed files
git log                                     # View commit history
git remote -v                               # List remotes

# Branching
git branch                                  # List branches
git checkout -b branch-name                 # Create new branch
git push origin branch-name                 # Push branch

# Undoing changes
git reset HEAD~1                            # Undo last commit (keep changes)
git checkout .                              # Discard local changes
git revert HEAD                             # Create new commit to undo changes

# Pulling updates
git pull origin main                        # Get latest from GitHub
git fetch origin                            # Download latest without merging
```

---

## 🎉 Success!

Once you see your repository on GitHub with all files (except ignored ones):

```
✅ Project uploaded to GitHub
✅ Version control established
✅ Backup created online
✅ Shareable with team members
✅ Ready for collaboration
```

---

## 🔗 Next Steps

After successful upload:

1. **Share Repository**
   - Copy GitHub URL: `https://github.com/YOUR_USERNAME/ChainVault`
   - Send to colleagues/instructors

2. **Set Up Collaboration**
   - Add collaborators (Settings → Collaborators)
   - Create GitHub Projects for tracking
   - Enable issue templates

3. **Continuous Integration** (Optional)
   - Add GitHub Actions for CI/CD
   - Automated testing on push
   - Automated deployments

4. **Documentation**
   - GitHub Pages for hosted documentation
   - Deployment guides
   - API documentation

---

**Happy coding! 🚀**
