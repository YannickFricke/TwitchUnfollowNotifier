import { Database } from './data/Database';
import logger from './logging/Logger';
import { PushbulletClient } from './pushbullet/PushbulletClient';
import { IUserData } from './structures/IUserData';
import { TwitchChatClient } from './twitch/TwitchChatClient';
import { TwitchClient } from './twitch/TwitchClient';

export class TwitchUnfollowNotifier {
    /**
     * The Twitch client that will be used for fetching the followers
     *
     * @private
     * @type {TwitchClient}
     * @memberof TwitchUnfollowNotifier
     */
    private twitchClient: TwitchClient;

    /**
     * The irc client for sending private messages
     *
     * @private
     * @type {TwitchChatClient}
     * @memberof TwitchUnfollowNotifier
     */
    private twitchChatClient: TwitchChatClient;

    /**
     * The Pushbullet client that will be used for sending the notifications
     *
     * @private
     * @type {PushbulletClient}
     * @memberof TwitchUnfollowNotifier
     */
    private pushbulletClient: PushbulletClient;

    /**
     * The persistent database
     *
     * @private
     * @type {Database}
     * @memberof TwitchUnfollowNotifier
     */
    private database: Database;

    /**
     * The channel id of the Twitch channel to monitor
     *
     * @private
     * @type {string}
     * @memberof TwitchUnfollowNotifier
     */
    private channelId: string;

    /**
     * The time to sleep
     *
     * @private
     * @memberof TwitchUnfollowNotifier
     */
    private sleepDelay = 1000 * 60;

    /**
     * Creates an instance of TwitchUnfollowNotifier.
     * @param {string} clientId The client id of the Twitch application
     * @param {number} channelId The channel id of the Twitch channel to check
     * @param {string} pushBulletToken The API token for Pushbullet
     * @memberof TwitchUnfollowNotifier
     */
    constructor(
        clientId: string,
        channelId: string,
        channelName: string,
        oauthToken: string,
        pushBulletToken: string,
    ) {
        this.twitchClient = new TwitchClient(
            clientId,
        );
        this.twitchChatClient = new TwitchChatClient(
            channelName,
            oauthToken,
        )
        this.pushbulletClient = new PushbulletClient(
            pushBulletToken,
        );
        this.database = new Database();
        this.channelId = channelId;

        this.run = this.run.bind(this);
    }

    public async setUp() {
        await this.twitchChatClient.connect();
        this.database.read();
    }

    /**
     * Runs the Twitch unfollow notifier
     *
     * @memberof TwitchUnfollowNotifier
     */
    public async run() {
        const followers = await this.twitchClient.getFollowers(this.channelId);

        logger.info('Checking for unfollows');

        this.database.followers.forEach(async (follower) => {
            if (followers.find(
                entry => entry.id === follower.id
            ) === undefined) {
                await this.notify(follower);

                this.database.removeFollower(follower.id);

                logger.info(
                    `User ${follower.name} unfollowed!`,
                );
            }
        });

        followers.forEach(entry => {
            if (this.database.containsFollower(entry.id)) {
                return;
            }

            logger.info(`User ${entry.name} follows now`);

            this.database.addNewFollower(entry);
        })

        logger.info('Checked for unfollows');

        this.database.save();

        setTimeout(this.run, this.sleepDelay);
    }

    /**
     * Notifies the user through Pushbullet
     *
     * @private
     * @param {string} username The name of the user who unfollowed
     * @memberof TwitchUnfollowNotifier
     */
    private async notify(userdata: IUserData) {
        const userName = userdata.name;
        const userLanguage = await this.twitchClient.getUserLanguage(userdata.id);
        let message = '';

        this.pushbulletClient.notify(userName);

        switch (userLanguage) {
            case 'de':
                message = `KonCha ${userName}, ich habe gerade gemerkt das du mir nicht mehr folgst. Magst du eventuell sagen warum, sodass ich meinen Stream verbessern kann? :)`;
                break;
            default:
                message = `KonCha ${userName}, I noticed that you don't follow me anymore. Would you like to tell me the reason so that I can improve my stream? :)`;
                break;
        }

        logger.debug(`Sending message to ${userName}. Language: ${userLanguage}`);
        this.twitchChatClient.sendPrivateMessage(userName, message);
        logger.debug(`Sent message to ${userName}. Language: ${userLanguage}`);
    }
}