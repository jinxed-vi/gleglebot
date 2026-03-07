export interface Config {
    instanceUrl: string;
    username: string;
    password?: string;
    token?: string;
    pollingIntervalMs: number;
}

export function getConfig(): Config {
    const instanceUrl = process.env.LEMMY_INSTANCE_URL;
    const username = process.env.LEMMY_USERNAME;
    const password = process.env.LEMMY_PASSWORD;
    const token = process.env.LEMMY_TOKEN;

    if (!instanceUrl) {
        throw new Error('LEMMY_INSTANCE_URL is not defined in the environment.');
    }

    if (!username) {
        throw new Error('LEMMY_USERNAME is not defined in the environment.');
    }

    if (!password && !token) {
        throw new Error('Either LEMMY_PASSWORD or LEMMY_TOKEN must be defined.');
    }

    const pollingIntervalMs = process.env.POLLING_INTERVAL_MS
        ? parseInt(process.env.POLLING_INTERVAL_MS, 10)
        : 30000;

    return {
        instanceUrl,
        username,
        password,
        token,
        pollingIntervalMs,
    };
}
