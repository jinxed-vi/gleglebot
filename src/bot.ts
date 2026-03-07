import { LemmyBot } from 'lemmy-bot';
import { Config } from './config.js';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./gleglebot_milestones.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS post_milestones (
        post_id INTEGER PRIMARY KEY,
        target INTEGER
    )`);
});

const getMilestone = (postId: number): Promise<number> => {
    return new Promise((resolve, reject) => {
        db.get('SELECT target FROM post_milestones WHERE post_id = ?', [postId], (err, row: any) => {
            if (err) reject(err);
            else resolve(row ? row.target : 0);
        });
    });
};

const setMilestone = (postId: number, target: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO post_milestones (post_id, target) VALUES (?, ?) 
                ON CONFLICT(post_id) DO UPDATE SET target = excluded.target`,
            [postId, target], (err) => {
                if (err) reject(err);
                else resolve();
            });
    });
};

const ENCOURAGING_MESSAGES = [
    "Ygmi!",
    "Based and gleglepilled!",
    "They ~~glow~~, you **shine**"
]

export class Gleglebot {
    private config: Config;
    private bot: any;
    private postActionsCount: number;

    constructor(config: Config) {
        this.config = config;
        this.postActionsCount = 0;

        setInterval(() => {
            this.postActionsCount = 0;
        }, (this.config.secondsBetweenPolls - 1) * 1000);

        const instanceStr = this.config.instanceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

        this.bot = new LemmyBot({
            dbFile: './gleglebot.db',
            instance: instanceStr,
            credentials: {
                username: this.config.username,
                password: this.config.password || ''
            },
            connection: {
                secondsBetweenPolls: this.config.secondsBetweenPolls
            },
            dryRun: this.config.dryRun,
            handlers: {
                comment: {
                    sort: 'New',
                    handle: ({
                        commentView: {
                            comment: { content, id, post_id }
                        },
                        botActions: { createComment },
                        preventReprocess,
                        reprocess
                    }) => {
                        if (content.includes('!glegle loveme')) {
                            if (this.postActionsCount >= this.config.maxPostActionsPerRun) {
                                console.log(`Max post actions per run reached. Skipping comment ${id}.`);
                                reprocess(5);
                                return;
                            }
                            this.postActionsCount++;
                            console.log(`Responding to comment ${id}.`);
                            createComment({
                                content: ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)],
                                post_id: post_id,
                                parent_id: id
                            });
                            preventReprocess();
                        }
                    }
                },
                post: {
                    sort: 'Active',
                    handle: async ({
                        postView: {
                            counts: { upvotes },
                            post: { id }
                        },
                        botActions: { createComment },
                        preventReprocess,
                        reprocess
                    }) => {
                        const targets = [10, 25, 50, 100];
                        let metTarget = 0;
                        for (const target of targets) {
                            if (upvotes >= target) {
                                metTarget = target;
                            }
                        }

                        if (metTarget > 0) {
                            const lastReached = await getMilestone(id);
                            if (this.postActionsCount >= this.config.maxPostActionsPerRun) {
                                console.log(`Max post actions per run reached. Skipping post ${id}.`);
                                reprocess(5);
                                return;
                            }
                            this.postActionsCount++;
                            try {
                                if (metTarget > lastReached) {
                                    console.log(`Post ${id} reached ${metTarget} upvotes. Posting comment.`);
                                    await createComment({
                                        post_id: id,
                                        content: `Waow! This post has reached ${metTarget} upvotes!`
                                    });
                                    await setMilestone(id, metTarget);
                                }
                            } catch (e) {
                                console.error(`Error checking/setting milestone for post ${id}`, e);
                            }
                        }

                        if (metTarget < 100) {
                            reprocess(5);
                        } else {
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
