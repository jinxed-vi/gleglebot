import { LemmyHttp, CommentView, PostView } from 'lemmy-js-client';
import { Config } from './config.js';
import { actions } from './actions/index.js';

export class Gleglebot {
    private config: Config;
    private client: LemmyHttp;
    private token?: string;
    private lastCheckedTime: string;

    constructor(config: Config) {
        this.config = config;
        this.client = new LemmyHttp(this.config.instanceUrl);
        this.lastCheckedTime = new Date().toISOString();
    }

    async initialize() {
        if (this.config.token) {
            this.token = this.config.token;
            this.client.setHeaders({ Authorization: `Bearer ${this.token}` });
            return;
        }

        if (this.config.password) {
            console.log(`Logging in as ${this.config.username}...`);
            const res = await this.client.login({
                username_or_email: this.config.username,
                password: this.config.password,
            });

            if (!res.jwt) {
                throw new Error('Login failed: did not receive a JWT token.');
            }

            this.token = res.jwt;
            this.client.setHeaders({ Authorization: `Bearer ${this.token}` });
            console.log('Successfully logged in.');
        }
    }

    async startPolling() {
        setInterval(async () => {
            try {
                await this.pollActions();
            } catch (err) {
                console.error('Error during polling step:', err);
            }
        }, this.config.pollingIntervalMs);
    }

    private async pollActions() {
        console.log(`[${new Date().toISOString()}] Polling for new content...`);
        const currentTime = new Date().toISOString();

        // Fetch new posts
        const postsRes = await this.client.getPosts({
            sort: 'new',
            limit: 20,
        });

        const newPosts = postsRes.items.filter((p: any) => p.post.published > this.lastCheckedTime);
        for (const postView of newPosts) {
            await this.handleNewPost(postView);
        }

        // Fetch new comments
        const commentsRes = await this.client.getComments({
            sort: 'new',
            limit: 20,
        });

        const newComments = commentsRes.items.filter((c: any) => c.comment.published > this.lastCheckedTime);
        for (const commentView of newComments) {
            await this.handleNewComment(commentView);
        }

        this.lastCheckedTime = currentTime;
    }

    private async handleNewPost(postView: PostView) {
        console.log(`New post discovered: ${postView.post.name}`);
        for (const action of actions) {
            try {
                if (action.handleNewPost) {
                    await action.handleNewPost(postView);
                }
            } catch (err) {
                console.error(`Action '${action.name}' failed on post:`, err);
            }
        }
    }

    private async handleNewComment(commentView: CommentView) {
        console.log(`New comment discovered: ${commentView.comment.content.substring(0, 50)}...`);
        for (const action of actions) {
            try {
                if (action.handleNewComment) {
                    await action.handleNewComment(commentView);
                }
            } catch (err) {
                console.error(`Action '${action.name}' failed on comment:`, err);
            }
        }
    }
}
