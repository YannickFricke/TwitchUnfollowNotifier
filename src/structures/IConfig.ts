
/**
 * Describes the configuration file
 *
 * @export
 * @interface IConfig
 */
export interface IConfig {
    /**
     * Contains all the configuration settings for Twitch
     */
    twitch: {
        /**
         * The client id of the registered application
         */
        clientId: string;

        /**
         * The id of the channel to check
         */
        channelId: string;

        /**
         * The name of the channel
         */
        channelName: string;

        /**
         * The OAuth token for logging in into the IRC server
         */
        oauthToken: string;
    };

    /**
     * Contains all configuration settings for Pushbullet
     */
    pushbullet: {
        apiToken: string;
    };

    /**
     * Settings for the application
     */
    settings: {
        /**
         * The amount of checks before unfollowers are messaged
         */
        checksBeforeNotification: number;

        /**
         * When set to true the TwitchUnfollowNotifier will message unfollowers
         */
        messageUsers: boolean;
    }
}
