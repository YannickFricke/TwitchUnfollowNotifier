/**
 * Describes the configuration file
 *
 * @export
 * @interface IConfig
 */
export interface IConfig {
    twitch: {
        clientId: string;
        channelId: string;
        channelName: string;
        oauthToken: string;
    };
    pushbullet: {
        apiToken: string;
    }
}