# Prodapp UX — Knowledge Base App

React app connecting to the team GitHub repo as a live KB store.

## Deploy via GitHub Pages (free, no Vercel needed)

### One-time setup (2 minutes)

1. Go to repo Settings → Pages
2. Under "Source", select **GitHub Actions**
3. Go to repo Settings → Secrets and variables → Actions
4. Click **New repository secret**:
   - Name: `VITE_GITHUB_PAT`
   - Value: your GitHub Personal Access Token
5. Done — every push to `app/` auto-deploys

### Your live URL

After the first deploy completes (~2 min), the app is live at:
**https://ykshetty89.github.io/Prodapp-UX-Knowledge-base-test/**

The Actions tab shows deployment status.

## Run locally

```bash
cd app
npm install
cp .env.example .env.local
# paste your PAT into .env.local
npm run dev
```
