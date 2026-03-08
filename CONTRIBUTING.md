# Contributing to Gleglebot

First off, thank you for considering contributing to Gleglebot!

## Development Environment Setup

This project uses [Yarn](https://yarnpkg.com/) for dependency management and is written in TypeScript. The bot connects to a Lemmy instance using the `lemmy-bot` library.

### Prerequisites

- Node.js (v18 or higher recommended)
- Yarn (v4.x is currently configured)

### 1. Clone the repository and install dependencies

```bash
git clone <repository-url>
cd gleglebot
yarn install
```

### 2. Setting up configuration

Gleglebot uses environment variables for configuration. You need to create a local `.env` file to run the bot.

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and configure your credentials and target instance:
   - `LEMMY_INSTANCE_URL`: The Lemmy instance you want your bot to target (e.g., `https://lemmy.world`).
   - `LEMMY_USERNAME`: Your bot's registered account username.
   - `LEMMY_PASSWORD`: Your bot's password.
   - `DRY_RUN`: Set to `true` to test changes without actively polling and making API calls to production.
   - `MAX_POST_ACTIONS_PER_RUN`: Limits the number of actions to prevent spamming.

### 3. Running the Bot locally

During development, you can run the bot directly inside a TypeScript executor without having to build it manually:

```bash
yarn dev
```

### 4. Building for Production

When you are ready to prepare a production build:

```bash
yarn build
```
This will compile the TypeScript output correctly using `tsup`. You can then run the built index entrypoint via:
```bash
yarn start
```

## Making Changes

- Ensure your changes keep the existing code style. The entrypoint is `src/index.ts`, and core bot logic usually sits in `src/bot.ts`.
- Gleglebot uses a simple filesystem-backed caching logic (`milestones.json`) internally to prevent duplicate milestone messaging, so avoid making disruptive database schema additions if possible.
- If you're adding new bot commands or replying handlers, verify `maxPostActionsPerRun` rate-limiting is adhered to within the new handlers to prevent throttling.

## Submitting a Pull Request

1. Fork the repository and create a new branch from `main`.
2. Make your proposed changes and test them locally using `yarn dev`.
3. Submit a Pull Request outlining what your changes do and why they are necessary!

Thank you!
