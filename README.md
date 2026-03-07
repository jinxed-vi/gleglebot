# Gleglebot

A Fediverse bot for Lemmy built with TypeScript and Node.js. It performs various automated moderator and engagement actions for communities.

## Prerequisites

- Node.js
- [pnpm](https://pnpm.io/)

## Setup

1. Clone the repository
2. Run `pnpm install`
3. Copy `.env.example` to `.env` and fill in your Lemmy instance details.

## Running

- Dev mode (watches files and restarts using tsx): `pnpm dev`
- Production build: `pnpm build` then `pnpm start`

## Architecture

- `src/index.ts`: Entry point to initialize and start the bot.
- `src/bot.ts`: Defines the main logic, polling instance for new content and posts.
- `src/actions/`: Modular action handlers that hook into new comments/posts for moderation or engagement.
