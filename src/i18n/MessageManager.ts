import { readFileSync } from 'fs';
import { IKeyValue } from '../structures/IKeyValue';

export class MessageManager {
    private fileName = './data/messages.json';

    private messages!: IKeyValue & {
        default: string;
    };

    /**
     * Reads the messages from the file
     *
     * @memberof MessageManager
     */
    public readMessages() {
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