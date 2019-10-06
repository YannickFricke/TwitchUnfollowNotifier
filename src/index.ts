import { existsSync, readFileSync } from 'fs';
import logger from './logging/Logger';
import { IConfig } from './structures/IConfig';
import { TwitchUnfollowNotifier } from './TwitchUnfollowNotifier';

// Read the configuration file

const configFilePath = './config.json';

if (!existsSync(configFilePath)) {
    logger.error(`The config file "${configFilePath}" does not exists`);
    process.exit(1);
}

const readConfig: IConfig = JSON.parse(
    readFileSync(configFilePath).toString('UTF-8'),
);

async function main() {
    const twitchUnfollowNotifier = new TwitchUnfollowNotifier(
        readConfig.twitch.clientId,
        readConfig.twitch.channelId,
        readConfig.twitch.channelName,
        readConfig.twitch.oauthToken,
        readConfig.pushbullet.apiToken,
        readConfig.settings.checksBeforeNotification,
    );

    logger.info('Starting up!');

    await twitchUnfollowNotifier.setUp();

    twitchUnfollowNotifier.run();
}

main();
