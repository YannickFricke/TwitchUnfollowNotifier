/**
 * Represents the data structure from the Twitch endpoint
 *
 * @export
 * @interface IFollowerData
 */
export interface IFollowerData {
    /**
     * Contains the user id of the user who followed
     *
     * @type {string}
     * @memberof IFollowerData
     */
    from_id: string;

    /**
     * Contains the username of the user who followed
     *
     * @type {string}
     * @memberof IFollowerData
     */
    from_name: string;

    /**
     *  
     *
     * @type {string}
     * @memberof IFollowerData
     */
    to_id: string;

    /**
     * Contains the username who got followed
     *
     * @type {string}
     * @memberof IFollowerData
     */
    to_name: string;

    /**
     * Contains the timestamp when the follow was made
     *
     * @type {string}
     * @memberof IFollowerData
     */
    followed_at: string;
}