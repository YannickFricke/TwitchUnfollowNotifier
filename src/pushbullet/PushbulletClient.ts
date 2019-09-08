import axios, { AxiosInstance } from 'axios';

export class PushbulletClient {
    /**
     * The HTTP client which will be used for the HTTP requests
     *
     * @private
     * @type {AxiosInstance}
     * @memberof PushbulletClient
     */
    private httpClient: AxiosInstance;

    /**
     * Creates an instance of PushbulletClient.
     * @param {string} apiToken The API token for the Pushbullet API
     * @memberof PushbulletClient
     */
    constructor(
        apiToken: string,
    ) {
        this.httpClient = axios.create({
            headers: {
                'Access-Token': apiToken,
            }
        });
    }

    public async notify(
        username: string,
    ) {
        await this.httpClient.post('https://api.pushbullet.com/v2/pushes', {
            type: 'note',
            title: 'Twitch Unfollow Notifier',
            body: `${username} folgt dir nun nicht mehr!`,
        });
    }
}