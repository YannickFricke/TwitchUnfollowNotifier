import axios, { AxiosInstance } from 'axios';
import logger from '../logging/Logger';
import { IKeyValue } from '../structures/IKeyValue';
import { IUserData } from '../structures/IUserData';
import { IFollowerData } from './IFollowerData';

export class TwitchClient {
    /**
     * The client id of the Twitch application
     *
     * @private
     * @type {string}
     * @memberof TwitchClient
     */
    private clientId: string;

    private baseUrl = 'https://api.twitch.tv/helix/users/follows?';

    private httpClient: AxiosInstance;

    /**
     * Creates an instance of TwitchClient.
     * @param {string} clientId The client id of the Twitch application
     * @memberof TwitchClient
     */
    constructor(
        clientId: string,
    ) {
        this.clientId = clientId;

        this.httpClient = axios.create({
            headers: {
                'Client-ID': this.clientId,
            }
        })
    }

    /**
     * Returns the followers for the given channel
     *
     * @param {number} channelId The channel to check
     * @returns {string[]} The fetched followers
     * @memberof TwitchClient
     */
    public async getFollowers(channelId: string): Promise<IUserData[]> {
        logger.debug(`Fetching followers for channel: ${channelId}`)

        const twichFollowerData = await this.fetchFollowerData(channelId);

        return Promise.resolve(twichFollowerData.map((entry: IFollowerData) => {
            return {
                id: entry.from_id,
                name: entry.from_name,
            };
        }));
    }

    /**
     * Fetches the follower data from Twitch for the given channel id
     *
     * @private
     * @param {number} channelId The channel id to check
     * @returns {Promise<IFollowerData[]>} The read followers
     * @memberof TwitchClient
     */
    private async fetchFollowerData(channelId: string): Promise<IFollowerData[]> {
        const fetchedData: IFollowerData[] = [];
        let nextCursor = '';

        const queryParameters: IKeyValue = {
            to_id: channelId,
        }

        do {
            let response;

            try {
                response = await this.httpClient.get(
                    this.baseUrl + this.getQueryString(queryParameters),
                );
            } catch (error) {
                let statusCode = error.code;
                let resetTimestamp = this.getCurrentTimestamp() + (60 * 1000);

                if (error.response !== undefined) {
                    if (statusCode === undefined) {
                        const errorResponseData = error.response.data;

                        statusCode = errorResponseData.status;
                    }

                    const resetHeader = error.response.headers['ratelimit-reset'];

                    if (resetHeader !== undefined) {
                        logger.debug('Rate limit header was found');
                        resetTimestamp = parseInt(resetHeader, 10);
                    }
                }

                if (statusCode === 429) {
                    logger.warn('Hit the API rate limit!');
                    logger.warn(`Waiting until: ${resetTimestamp}`);

                    await this.waitUntilTimeStamp(resetTimestamp);

                    continue;
                } else {
                    logger.error(`Unknown status code: ${statusCode}`);
                }

                logger.error(
                    `Could not fetch the followers: ${error}`,
                );

                break;
            }

            const responseData = response.data;

            fetchedData.push(
                ...responseData.data,
            );

            const paginationData = responseData.pagination;

            if (paginationData === undefined || paginationData === null) {
                break;
            }

            nextCursor = paginationData.cursor;

            if (nextCursor === undefined || nextCursor === null) {
                break;
            }

            queryParameters.after = nextCursor;

        } while (nextCursor !== '');


        return fetchedData;
    }

    /**
     * Returns the user language
     *
     * @param {string} userId The id of the user to check
     * @returns {(Promise<string | undefined>)} Undefined when an error occured. Otherwise the set language.
     * @memberof TwitchClient
     */
    public async getUserLanguage(userId: string): Promise<string | undefined | null> {
        let response;

        try {
            response = await this.httpClient.get(`https://api.twitch.tv/kraken/channels/${userId}`);
        } catch (error) {
            // Account does not exists anymore
            if (error.code === 422) {
                return Promise.resolve(null);
            }

            logger.error(`Could not fetch the user language for user ${userId}: ${error}`);

            return Promise.resolve(undefined);
        }

        const responseData = response.data;

        if (responseData === null || responseData === undefined) {
            return Promise.resolve(undefined);
        }

        const userLanguage = responseData.language;

        if (userLanguage === null || userLanguage === undefined) {
            return Promise.resolve(undefined);
        }

        return Promise.resolve(userLanguage);
    }

    private getQueryString(params: any) {
        const esc = encodeURIComponent;
        return Object.keys(params)
            .map((k) => esc(k) + '=' + esc(params[k]))
            .join('&');
    }

    /**
     * Returns a promise which resolves when the timestamp was exceeded
     *
     * @private
     * @param {number} timestamp The timestamp which will be awaited
     * @returns
     * @memberof TwitchClient
     */
    private waitUntilTimeStamp(timestamp: number): Promise<NodeJS.Timeout> {
        const currentTimestamp = this.getCurrentTimestamp();
        const difference = (timestamp - currentTimestamp) * 1000;

        logger.debug(`Current timestamp: ${currentTimestamp}`);
        logger.debug(`Timestamp difference: ${difference}`);

        return new Promise((resolve) => setTimeout(resolve, difference));
    }

    /**
     * Returns the current unix timestamp
     *
     * @private
     * @returns The current unix timestamp
     * @memberof TwitchClient
     */
    private getCurrentTimestamp() {
        return Math.round((new Date()).getTime() / 1000);
    }
}