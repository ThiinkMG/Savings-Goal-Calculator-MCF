# Complete Guide: Deploy Replit App to GitHub Pages

This guide covers the complete process of converting a full-stack Replit application to a static site and deploying it to GitHub Pages.

## Prerequisites

- A Replit project that you want to deploy
- A GitHub account
- Git configured on your local machine
- Node.js and npm installed

## Step 1: Initial Repository Setup

### 1.1 Create GitHub Repository
1. Go to GitHub and create a new repository
2. Name it appropriately (e.g., `your-app-name`)
3. Make it public (required for free GitHub Pages)
4. Don't initialize with README, .gitignore, or license (we'll add these)

### 1.2 Clone Repository Locally
```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

### 1.3 Copy Replit Project Files
1. Download your Replit project files
2. Copy all files to your local repository directory
3. Exclude `.replit`, `.config`, and other Replit-specific files

## Step 2: Clean Up Repository

### 2.1 Remove Unnecessary Files
Remove development files, guides, and temporary files:
```bash
# Remove guide files, test files, and temporary files
rm -rf Guides/
rm -f *.txt
rm -f *.html
rm -f *.sh
rm -f *.md (except this guide)
```

### 2.2 Update .gitignore
Create or update `.gitignore`:
```gitignore
node_modules
dist
.DS_Store
server/public
vite.config.ts.*
*.tar.gz

# Replit-specific
.replit
.config

# Test/Debug files
*.txt
test*.html
*.sh

# Environment files
.env
.env.local

# Build/Cache
.vite
.turbo
build

# Local development files
.local/
```

## Step 3: Convert to Static Site

### 3.1 Update package.json
Remove server-side dependencies and update scripts:

```json
{
  "name": "your-app-name",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "tsc"
  },
  "dependencies": {
    // Keep only client-side dependencies
    // Remove: express, database drivers, server-side auth, etc.
  },
  "devDependencies": {
    // Keep only build tools and client-side dev dependencies
  }
}
```

### 3.2 Update Vite Configuration
Configure `vite.config.ts` for GitHub Pages:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    assetsDir: "assets",
  },
  base: "/your-repo-name/", // Replace with your actual repo name
});
```

### 3.3 Fix Router Configuration
Update your React router to work with GitHub Pages base path:

```typescript
// In your main App component
import { Switch, Route, Router as WouterRouter } from "wouter";

function Router() {
  return (
    <WouterRouter base="/your-repo-name"> {/* Replace with your repo name */}
      <Switch>
        <Route path="/" component={HomePage} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}
```

## Step 4: Create GitHub Actions Workflow

### 4.1 Create Workflow Directory
```bash
mkdir -p .github/workflows
```

### 4.2 Create Deployment Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Setup Pages
      uses: actions/configure-pages@v4
      
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Step 5: Authentication and Git Setup

### 5.1 Configure Git Credentials
```bash
# Set your GitHub username and email
git config --global user.name "YourGitHubUsername"
git config --global user.email "your-email@example.com"
```

### 5.2 Create Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "GitHub Pages Deployment")
4. Select scopes: `repo`, `workflow`, `write:packages`
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### 5.3 Configure Remote with Authentication
```bash
# Set remote URL with your username
git remote add origin https://YourGitHubUsername@github.com/YourGitHubUsername/your-repo-name.git

# Or use SSH (if you have SSH keys set up)
git remote add origin git@github.com:YourGitHubUsername/your-repo-name.git
```

## Step 6: Test and Deploy

### 6.1 Test Local Build
```bash
# Install dependencies
npm install

# Test the build
npm run build

# Verify dist folder contains index.html and assets
ls -la dist/
```

### 6.2 Commit and Push
```bash
# Add all files
git add .

# Commit changes
git commit -m "Convert to static site for GitHub Pages deployment"

# Push to GitHub
git push -u origin main
```

### 6.3 Configure GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **"GitHub Actions"**
5. Click **Save**

### 6.4 Monitor Deployment
1. Go to the **Actions** tab in your repository
2. Look for the "Deploy to GitHub Pages" workflow
3. Wait for it to complete (green checkmark ✅)
4. Your site will be available at: `https://yourusername.github.io/your-repo-name/`

## Step 7: Troubleshooting Common Issues

### 7.1 404 "File not found" Error
- **Cause**: GitHub Pages not configured or workflow failed
- **Solution**: 
  - Check repository Settings → Pages → Source is set to "GitHub Actions"
  - Verify the Actions tab shows successful deployment
  - Wait 5-10 minutes for propagation

### 7.2 404 "Did you forget to add the page to the router?" Error
- **Cause**: Router not configured for GitHub Pages base path
- **Solution**: Update router with correct base path (see Step 3.3)

### 7.3 Build Failures
- **Cause**: Missing dependencies or server-side code
- **Solution**: 
  - Remove all server-side dependencies from package.json
  - Remove server-side imports and code
  - Test build locally with `npm run build`

### 7.4 Authentication Issues
- **Cause**: Wrong credentials or permissions
- **Solution**:
  - Use Personal Access Token as password
  - Ensure token has correct permissions
  - Check repository access permissions

## Step 8: Final Verification

### 8.1 Check Deployment Status
1. Go to repository Actions tab
2. Verify "Deploy to GitHub Pages" workflow completed successfully
3. Check the deployment URL in the workflow output

### 8.2 Test Your Site
1. Visit: `https://yourusername.github.io/your-repo-name/`
2. Test all functionality
3. Verify routing works correctly
4. Check that all assets load properly

## Important Notes

- **Static Only**: Your app will be client-side only (no server functionality)
- **Data Storage**: Use localStorage for user data persistence
- **No Backend**: Remove all server-side features (database, authentication, email, etc.)
- **Base Path**: Always use the correct repository name in base path configuration
- **Build Size**: Keep build under 1GB (GitHub Pages limit)

## Quick Reference Commands

```bash
# Initial setup
git clone https://github.com/username/repo-name.git
cd repo-name

# Clean up
rm -rf server/ Guides/ *.txt *.html *.sh

# Update configs (see steps above)

# Test build
npm install
npm run build

# Deploy
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

## Support

If you encounter issues:
1. Check the Actions tab for error logs
2. Verify all configuration files are correct
3. Test the build locally first
4. Ensure GitHub Pages is enabled in repository settings

---

**Remember**: Replace `your-repo-name` and `YourGitHubUsername` with your actual repository name and GitHub username throughout this guide.
