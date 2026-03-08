import { LemmyBot } from 'lemmy-bot';
import { Config } from './config.js';
import fs from 'fs';

const MILESTONES_FILE = './milestones.json';
let postMilestones: Record<number, number> = {};

if (fs.existsSync(MILESTONES_FILE)) {
    try {
        postMilestones = JSON.parse(fs.readFileSync(MILESTONES_FILE, 'utf-8'));
    } catch (e) {
        console.error('Error reading milestones.json', e);
    }
}

const saveMilestones = () => {
    try {
        fs.writeFileSync(MILESTONES_FILE, JSON.stringify(postMilestones, null, 2));
    } catch (e) {
        console.error('Error saving milestones.json', e);
    }
};

const getMilestone = async (postId: number): Promise<number> => {
    return Promise.resolve(postMilestones[postId] || 0);
};

const setMilestone = async (postId: number, target: number): Promise<void> => {
    postMilestones[postId] = target;
    saveMilestones();
    return Promise.resolve();
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
                            post: { id, creator_id, url },
                            community: { name: communityName }
                        },
                        botActions: { sendPrivateMessage },
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
                                    console.log(`Post ${id} reached ${metTarget} upvotes. Sending private message.`);
                                    await sendPrivateMessage({
                                        recipient_id: creator_id,
                                        content: `Your post in !${communityName}@${instanceStr} has reached ${metTarget} upvotes!\n\nCheck it out: https://${instanceStr}/post/${id}`
                                    });
                                    await setMilestone(id, metTarget);
                                }
                            } catch (e) {
                                console.error(`Error checking/setting milestone for post ${id}`, e);
                                reprocess(5);
                                return;
                            }
                            if (metTarget < 100) {
                                reprocess(5);
                            } else {
                                preventReprocess();
                            }
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
