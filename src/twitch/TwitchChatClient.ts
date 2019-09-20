import { Client } from "tmi.js";
import logger from '../logging/Logger';

export class TwitchChatClient {
    /**
     * Contains the IRC client from tmi.js
     *
     * @private
     * @type {Client}
     * @memberof TwitchChatClient
     */
    private ircClient: Client;

    /**
     * When set to true the client is connected
     *
     * @private
     * @type {boolean}
     * @memberof TwitchChatClient
     */
    private connected: boolean;

    /**
     * The current number of tries that has been made
     *
     * @private
     * @type {number}
     * @memberof TwitchChatClient
     */
    private try: number = 0;

    private maxTries: number = 3;

    /**
     * Creates an instance of TwitchChatClient.
     * @param {string} username The channel name of the user
     * @param {string} oauthToken The oauth token for logging in
     * @memberof TwitchChatClient
     */
    constructor(
        username: string,
        oauthToken: string,
    ) {
        this.ircClient = Client({
            identity: {
                username,
                password: oauthToken,
            },
            channels: [
                username,
            ]
        });

        this.connected = false;

        this.onConnect = this.onConnect.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);

        this.ircClient.on('connected', this.onConnect);
        this.ircClient.on('disconnected', this.onDisconnect);
    }

    /**
     * Connects the IRC client with the server
     *
     * @memberof TwitchChatClient
     */
    public async connect() {
        logger.debug('Connecting to the Twitch IRC server');
        await this.ircClient.connect();
    }

    private onConnect() {
        logger.debug('Connected to the Twitch IRC server');
        this.try = 0;
        this.connected = true;
    }

    private onDisconnect() {
        this.connected = false;
        logger.debug('Disconnected from the Twitch IRC server. Trying to reconnect');

        while (this.try < this.maxTries && !this.connected) {
            this.try += 1;
            this.connect();
        }

        if (!this.connected) {
            logger.error('Could not reconnect to the Twitch IRC server. Stopping!');

            process.exit(1);
        }
    }

    /**
     * Sends a private message to the given user
     *
     * @param {string} username The name of the user
     * @param {string} message The message to send
     * @memberof TwitchChatClient
     */
    public sendPrivateMessage(
        username: string,
        message: string,
    ) {
        this.ircClient.whisper(username, message);
    }
}