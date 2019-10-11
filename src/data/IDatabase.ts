import { IUserData } from '../structures/IUserData';

/**
 * Contains the structure for the database.json file
 */
export interface IDatabase {
    /**
     * Contains all saved followers
     */
    followers: IUserData[];

    /**
     * Contains all users who were already messaged
     */
    messagedUsers: string[];
}