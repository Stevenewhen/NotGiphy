# NotGiphy

A GIF search app built with React, TypeScript, and Vite, using the Giphy API.

## Live demo

Not deployed yet.

## Features

- Search GIFs, with results updating shortly after you stop typing (debounced)
- Search state is synced to the URL (`?q=`), so results are shareable and bookmarkable
- Click (or Tab to + Enter/Space) any GIF to copy its GIF URL to the clipboard, with a confirmation toast
- "Load more" to page through additional results for a query
- Giphy's rate limit is handled gracefully — a banner is shown, and previously loaded results stay on screen
- Shows 3 trending GIFs before the user has searched

## Getting started

```
npm install
npm run dev
```

You'll need a free Giphy API key from the [Giphy Developer Dashboard](https://developers.giphy.com/dashboard/). Create a `.env` file in the project root:

```
VITE_GIPHY_API_KEY=your_key_here
```

## Tech

- React + TypeScript
- Vite
- No third-party UI or state libraries — native `fetch` and a small custom debounce hook
