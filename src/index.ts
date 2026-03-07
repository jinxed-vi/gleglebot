import 'dotenv/config';
import { Gleglebot } from './bot.js';
import { getConfig } from './config.js';

async function main() {
    console.log('Starting gleglebot...');

    const config = getConfig();

    const bot = new Gleglebot(config);

    try {
        await bot.initialize();
        await bot.startPolling();
        console.log('gleglebot is now running and polling for updates.');
    } catch (error) {
        console.error('Failed to start gleglebot:', error);
        process.exit(1);
    }
}

main();
