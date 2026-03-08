import { LemmyBot } from 'lemmy-bot';
import { Config } from './config.js';
import fs from 'fs';

const MILESTONES_FILE = './data/milestones.json';
const ENCOURAGING_MESSAGES_FILE = './data/encouraging_messages.json';

interface Milestones {
    upvoteMilestones: Record<number, number>;
    encouragingMessageMilestones: Record<number, number>;
}

let milestones: Milestones = {
    upvoteMilestones: {},
    encouragingMessageMilestones: {},
};
let encouragingMessages: Array<{ message: string, chance: number }> = [];

if (fs.existsSync(MILESTONES_FILE)) {
    try {
        milestones = JSON.parse(fs.readFileSync(MILESTONES_FILE, 'utf-8'));
    } catch (e) {
        console.error('Error reading milestones.json', e);
    }
}

if (fs.existsSync(ENCOURAGING_MESSAGES_FILE)) {
    try {
        encouragingMessages = JSON.parse(fs.readFileSync(ENCOURAGING_MESSAGES_FILE, 'utf-8'));
    } catch (e) {
        console.error('Error reading encouraging_messages.json', e);
    }
}

const saveMilestones = () => {
    try {
        fs.writeFileSync(MILESTONES_FILE, JSON.stringify(milestones, null, 2));
    } catch (e) {
        console.error('Error saving milestones.json', e);
    }
};

const getUpvoteMilestone = (postId: number): number => {
    return milestones.upvoteMilestones[postId] || 0;
};

const setUpvoteMilestone = (postId: number, target: number): void => {
    milestones.upvoteMilestones[postId] = target;
    saveMilestones();
};

const getEncouragingMessageMilestone = (postId: number): number => {
    return milestones.encouragingMessageMilestones[postId] || 0;
};

const setEncouragingMessageMilestone = (postId: number, target: number): void => {
    milestones.encouragingMessageMilestones[postId] = target;
    saveMilestones();
};


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

        const getEncouragingMessage = (username: string): string => {
            let chance = Math.random();

            // Pick best chance bracket
            let optimalChanceBracket = 1;

            for (const message of encouragingMessages) {
                if (message.chance < chance) {
                    continue;
                }

                if (optimalChanceBracket > message.chance) {
                    optimalChanceBracket = message.chance;
                }
            }

            let optimalMessages = encouragingMessages.filter((message) => message.chance === optimalChanceBracket);
            let randomOptimalMessage = optimalMessages[Math.floor(Math.random() * optimalMessages.length)];

            const original_encouraging_message_index = encouragingMessages.indexOf(randomOptimalMessage);
            const displayedCount = getEncouragingMessageMilestone(original_encouraging_message_index);
            setEncouragingMessageMilestone(original_encouraging_message_index, displayedCount + 1);

            const encouraging_message = randomOptimalMessage.message.replace('$USER$', `**${username}**`);
            return `${encouraging_message}

::: spoiler gleglebot stats
Chance of this message: \`${optimalChanceBracket}\`
Chance you rolled: \`${chance.toFixed(2)}\`
Times this message has been displayed (including this): \`${displayedCount + 1}\`
:::`;
        };

        this.bot = new LemmyBot({
            dbFile: './data/gleglebot.db',
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
                            comment: { content, id, post_id },
                            creator: { name: username }
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
                                content: getEncouragingMessage(username),
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
                            const lastReached = await getUpvoteMilestone(id);
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
                                    await setUpvoteMilestone(id, metTarget);
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
