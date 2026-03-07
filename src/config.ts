export interface Config {
    instanceUrl: string;
    username: string;
    password?: string;
    token?: string;
    dryRun?: boolean;
    maxPostActionsPerRun: number;
    secondsBetweenPolls: number;
}

export function getConfig(): Config {
    const instanceUrl = process.env.LEMMY_INSTANCE_URL;
    const username = process.env.LEMMY_USERNAME;
    const password = process.env.LEMMY_PASSWORD;
    const token = process.env.LEMMY_TOKEN;
    const dry_run = process.env.DRY_RUN === 'true';
    const max_post_actions_per_run = process.env.MAX_POST_ACTIONS_PER_RUN;
    const seconds_between_polls = process.env.SECONDS_BETWEEN_POLLS;

    if (!instanceUrl) {
        throw new Error('LEMMY_INSTANCE_URL is not defined in the environment.');
    }

    if (!username) {
        throw new Error('LEMMY_USERNAME is not defined in the environment.');
    }

    if (!password && !token) {
        throw new Error('Either LEMMY_PASSWORD or LEMMY_TOKEN must be defined.');
    }

    return {
        instanceUrl,
        username,
        password,
        token,
        dryRun: dry_run,
        maxPostActionsPerRun: max_post_actions_per_run ? parseInt(max_post_actions_per_run) : 5,
        secondsBetweenPolls: seconds_between_polls ? parseInt(seconds_between_polls) : 30,
    };
}
