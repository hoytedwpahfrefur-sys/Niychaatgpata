# Clan Website

This repository contains a multi-page clan website with a small realtime Node.js backend.

## Pages

- `x_index.html` – Welcome page + Roblox username capture
- `x_profile.html` – Profile setup (PFP upload, display name, pronouns, description)
- `x_Dashboard.html` – Stats cards, leaderboard, profile menu, dashboard chat panel
- `x_server-main.html` – Discord-style channel view
- `x_72&#72--6.html` – Admin panel
- `x_t1c€Tp0n@l.html` – Ticket panel

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app:

   ```bash
   npm start
   ```

3. Open:

   - http://localhost:3000/x_index.html
   - http://localhost:3000/x_profile.html
   - http://localhost:3000/x_Dashboard.html
   - http://localhost:3000/x_server-main.html

## Why files may not appear on GitHub

If you can see files locally but not in GitHub, most often one of these is true:

- Changes were committed only on a local branch and never pushed.
- You are viewing a different branch on GitHub than the one with the commit.
- The local repo has no GitHub remote configured.

Check and push with:

```bash
git branch --show-current
git remote -v
git push -u origin <your-branch-name>
```

If `git remote -v` is empty, add your GitHub repo first:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin <your-branch-name>
```
