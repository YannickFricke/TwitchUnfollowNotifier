import { readFileSync } from 'fs';
import { IKeyValue } from '../structures/IKeyValue';

type Messages = IKeyValue & {
    default: string;
}

/**
 * Manages messages based on their language
 *
 * @export
 * @class MessageManager
 */
export class MessageManager {
    /**
     * The filename where the messages are located
     *
     * @private
     * @memberof MessageManager
     */
    private fileName = './data/messages.json';

    /**
     * Contains the parsed messages
     *
     * @private
     * @type Messages
     * @memberof MessageManager
     */
    private messages!: Messages;

    /**
     * Reads the messages from the file
     *
     * @memberof MessageManager
     */
    public readMessages(): void {
        const fileContents = readFileSync(this.fileName);
        this.messages = JSON.parse(fileContents.toString('UTF-8'));
    }

    /**
     * Returns the message for the given language
     *
     * @param {string} language The language to check
     * @returns The message for the language or the default message when no message was found
     * @memberof MessageManager
     */
    public getMessageForLanguage(language: string): string {
        if (this.messages[language] === undefined) {
            return this.messages.default;
        }

        return this.messages[language];
    }
}
