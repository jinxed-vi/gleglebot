import { LemmyBot } from 'lemmy-bot';
import { Config } from './config.js';

export class Gleglebot {
    private config: Config;
    private bot: any;

    constructor(config: Config) {
        this.config = config;

        const instanceStr = this.config.instanceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

        this.bot = new LemmyBot({
            dbFile: './gleglebot.db',
            instance: instanceStr,
            credentials: {
                username: this.config.username,
                password: this.config.password || ''
            },
            handlers: {
                comment: {
                    sort: 'New',
                    handle: ({
                        commentView: {
                            comment: { content, id, post_id }
                        },
                        botActions: { createComment },
                        preventReprocess
                    }) => {
                        if (content.includes('!ping')) {
                            console.log(`[AutoResponder] Replying to comment ${id} with 'Pong!'`);

                            createComment({
                                content: 'Pong!',
                                post_id: post_id,
                                parent_id: id
                            });
                            preventReprocess();
                        }
                    }
                }
            }
        });
    }

    async initialize() {
        // Initialization logic is handled inside lemmy-bot start method
        console.log('Bot initialized.');
        return Promise.resolve();
    }

    async startPolling() {
        this.bot.start();
        return Promise.resolve();
    }
}
