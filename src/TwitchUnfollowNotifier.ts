import { Database } from './data/Database';
import { MessageManager } from './i18n/MessageManager';
import logger from './logging/Logger';
import { PushbulletClient } from './pushbullet/PushbulletClient';
import { IUserData } from './structures/IUserData';
import { TwitchChatClient } from './twitch/TwitchChatClient';
import { TwitchClient } from './twitch/TwitchClient';

/**
 * The application
 *
 * @export
 * @class TwitchUnfollowNotifier
 */
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
     * Manages all messages
     *
     * @private
     * @type {MessageManager}
     * @memberof TwitchUnfollowNotifier
     */
    private messageManager: MessageManager;

    /**
     * The channel id of the Twitch channel to monitor
     *
     * @private
     * @type {string}
     * @memberof TwitchUnfollowNotifier
     */
    private channelId: string;

    /**
     * The amount of checks to do before the notification is send
     *
     * @private
     * @type {number}
     * @memberof TwitchUnfollowNotifier
     */
    private checksBeforeNotification: number;

    /**
     * When set to true the unfollowers will be messaged
     */
    private shouldMessageUsers: boolean;

    /**
     * Contains the amount of unfollow checks for each user id
     *
     * @private
     * @type {Map<string, number>}
     * @memberof TwitchUnfollowNotifier
     */
    private unfollowChecks: Map<string, number>;

    /**
     * The time to sleep (15 minutes)
     *
     * @private
     * @memberof TwitchUnfollowNotifier
     */
    private sleepDelay = 1000 * 60 * 15;

    /**
     * Creates an instance of TwitchUnfollowNotifier.
     * @param {string} clientId The client id of the Twitch application
     * @param {number} channelId The channel id of the Twitch channel to check
     * @param {string} channelName The name of the channel
     * @param {string} oauthToken The OAuth token for the Twitch Chat
     * @param {string} pushBulletToken The API token for Pushbullet
     * @param {number} checksBeforeNotification Amount of checks before notifications should be send
     * @memberof TwitchUnfollowNotifier
     */
    constructor(
        clientId: string,
        channelId: string,
        channelName: string,
        oauthToken: string,
        pushBulletToken: string,
        checksBeforeNotification: number,
        shouldMessageUsers: boolean,
    ) {
        this.twitchClient = new TwitchClient(
            clientId,
        );
        this.twitchChatClient = new TwitchChatClient(
            channelName,
            oauthToken,
        );
        this.pushbulletClient = new PushbulletClient(
            pushBulletToken,
        );
        this.database = new Database();
        this.messageManager = new MessageManager();
        this.channelId = channelId;
        this.checksBeforeNotification = checksBeforeNotification;
        this.shouldMessageUsers = shouldMessageUsers;
        this.unfollowChecks = new Map<string, number>();

        this.run = this.run.bind(this);
    }

    /**
     * Sets up the Twitch unfollow notifier
     *
     * @memberof TwitchUnfollowNotifier
     */
    public async setUp() {
        await this.twitchChatClient.connect();
        this.database.read();
        this.messageManager.readMessages();
    }

    /**
     * Runs the Twitch unfollow notifier
     *
     * @memberof TwitchUnfollowNotifier
     */
    public async run() {
        const followers = await this.twitchClient.getFollowers(this.channelId);

        logger.info('Checking for unfollows');

        for (const knownFollower of this.database.followers) {
            if (followers.filter(
                entry => entry.id === knownFollower.id,
            ).length === 0) {
                if (!this.unfollowChecks.has(knownFollower.id)) {
                    this.unfollowChecks.set(knownFollower.id, 1);
                }

                const checkNumber = this.unfollowChecks.get(knownFollower.id) as number;

                logger.debug(`User ${knownFollower.name} does not follow since ${checkNumber} checks!`);

                this.unfollowChecks.set(knownFollower.id, checkNumber + 1);

                if (checkNumber < this.checksBeforeNotification) {
                    continue;
                }

                await this.notify(knownFollower);

                this.database.removeFollower(knownFollower.id);

                logger.info(
                    `User ${knownFollower.name} unfollowed!`,
                );
            }
        }

        followers.forEach(entry => {
            if (this.unfollowChecks.has(entry.id)) {
                logger.debug(`Deleted ${entry.name} from the unfollow check`);
                this.unfollowChecks.delete(entry.id);
            }

            if (this.database.containsFollower(entry.id)) {
                return;
            }

            logger.info(`User ${entry.name} follows now`);

            this.database.addNewFollower(entry);
        });

        logger.info('Checked for unfollows');

        this.database.save();

        setTimeout(this.run, this.sleepDelay);
    }

    /**
     * Notifies the user through Pushbullet
     *
     * @private
     * @param {string} userdata The data of the user
     * @memberof TwitchUnfollowNotifier
     */
    private async notify(userdata: IUserData) {
        const userName = userdata.name;
        const userId = userdata.id;
        const userLanguage = await this.twitchClient.getUserLanguage(userId);

        await this.pushbulletClient.notify(userName);

        if (this.database.containsMessagedUser(userId)) {
            return;
        }

        if (!this.shouldMessageUsers) {
            return;
        }

        this.database.addMessagedUser(userId);

        if (userLanguage === null) {
            logger.warn(`The channel of user ${userName} (${userId}) was deleted`);
            return;
        }

        let message = this.messageManager.getMessageForLanguage(userLanguage);
        message = message.replace('%username%', userName);

        logger.debug(`Sending message to ${userName}. Language: ${userLanguage}`);
        this.twitchChatClient.sendPrivateMessage(userName, message);
        logger.debug(`Sent message to ${userName}. Language: ${userLanguage}`);
    }
}
