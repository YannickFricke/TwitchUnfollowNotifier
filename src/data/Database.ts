import { existsSync, readFileSync, writeFileSync } from "fs";
import logger from '../logging/Logger';
import { IUserData } from '../structures/IUserData';
import { IDatabase } from './IDatabase';

/**
 * Manages all known followers
 *
 * @export
 * @class Database
 */
export class Database {
    /**
     * The filename of the database
     *
     * @private
     * @memberof Database
     */
    private fileName = 'database.json';

    /**
     * When set to true the database should save the data
     *
     * @private
     * @memberof Database
     */
    private shouldSave = false;

    /**
     * Contains all followers
     *
     * @public
     * @type {IUserData[]}
     * @memberof Database
     */
    public followers: IUserData[];

    /**
     * Contains all users who already got messaged
     *
     * @private
     * @type {string[]}
     * @memberof Database
     */
    private messagedUsers: string[];

    /**
     * Creates an instance of Database.
     * @memberof Database
     */
    constructor() {
        this.followers = [];
        this.messagedUsers = [];
    }

    /**
     * Adds a new follower to the database
     *
     * @param {IUserData} followerData The data of the follower to add
     * @memberof Database
     */
    public addNewFollower(followerData: IUserData): void {
        if (this.followers.includes(followerData)) {
            return;
        }

        this.followers = [
            followerData,
            ...this.followers,
        ];
        this.shouldSave = true;
    }

    /**
     * Removes a follower from the database
     *
     * @public
     * @param {string} userId The id of the user to remove
     * @memberof Database
     */
    public removeFollower(userId: string): void {
        this.followers = this.followers.filter((userEntry) => {
            return userEntry.id !== userId;
        });
        this.shouldSave = true;
    }

    /**
     * Checks if the database knows about the follower
     *
     * @param {string} userId The user id to look up
     * @returns {boolean} True when the database contains the follower. Otherwise false.
     * @memberof Database
     */
    public containsFollower(userId: string): boolean {
        return this.followers.find((follower) => {
            return follower.id === userId;
        }) !== undefined;
    }

    /**
     * Adds the given user id to the messaged users
     * 
     * @param userId The user id to add
     */
    public addMessagedUser(userId: string) {
        this.messagedUsers.push(userId);

        this.shouldSave = true;
    }

    /**
     * Checks if the given user id was already messaged
     * 
     * @param userId The user id to check
     */
    public containsMessagedUser(userId: string): boolean {
        return this.messagedUsers.find((messagedUser) => {
            return messagedUser === userId;
        }) !== undefined;
    }

    /**
     * Saves the database to the file
     *
     * @memberof Database
     */
    public save() {
        if (!this.shouldSave) {
            logger.debug('Not going to save the database');

            return;
        }

        logger.debug('Saving database');

        const databaseToSave: IDatabase = {
            followers: this.followers,
            messagedUsers: this.messagedUsers,
        }

        const dataToSave = JSON.stringify(
            databaseToSave,
            undefined,
            4,
        );

        writeFileSync(
            this.fileName,
            dataToSave,
        );

        logger.debug('Saved database');

        this.shouldSave = false;
    }

    /**
     * Reads the database
     *
     * @memberof Database
     */
    public read(): void {
        logger.debug('Reading database');

        if (!existsSync(this.fileName)) {
            logger.debug('Database does not exists.');

            this.followers = [];
            this.shouldSave = true;

            return;
        }

        const readFile = readFileSync(this.fileName);
        const parsedFile: IDatabase = JSON.parse(readFile.toString('UTF-8'));

        this.followers = parsedFile.followers;
        this.messagedUsers = parsedFile.messagedUsers;

        logger.debug('Read the database');
    }
}
