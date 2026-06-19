# Inkwell — Blog Platform

A clean, fully working blog platform with user auth, posts, comments, and likes.
Built with plain HTML + CSS + JavaScript. No frameworks, no build step needed.

---

## How to run locally (2 steps)

1. Open a terminal in this folder
2. Run:
   ```
   npx serve .
   ```
   Then open http://localhost:3000 in your browser.

> No Node? Just double-click `index.html` — it works directly in the browser too.

---

## How to put on GitHub (5 steps)

1. Go to https://github.com/new and create a new repo called `inkwell`
2. Open a terminal in this folder and run these commands one by one:

```bash
git init
git add .
git commit -m "Initial commit: Inkwell blog platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inkwell.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

3. Done! Your code is on GitHub.

---

## How to make it live (free, 1 minute)

Go to https://netlify.com → "Add new site" → "Deploy manually" → drag and drop this folder.
You get a live URL instantly.

---

## Demo accounts

| Username | Password  |
|----------|-----------|
| alice    | alice123  |
| bob      | bob123    |

Or register a new account from the app.

---

## Features

- User registration & login
- Create, edit, delete blog posts
- Tags on posts
- Like / unlike posts
- Threaded comments (add & delete)
- Author-only edit/delete controls
- Profile page with stats
- Data persists in browser localStorage
