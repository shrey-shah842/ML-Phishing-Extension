/**
 * BotpressChat class to handle Botpress chat interactions.
 * It enables the creation of a chatbot popup window, creating a user and retrieving the key for later use.
 */


class BotpressChat {
    /**
     * Constructor for BotpressChat class.
     * @constructor
     * Initializes the bot ID and base URL for Botpress.
     */
    constructor() {
        this.botId = 'redacted';
        this.baseUrl = 'https://chat.botpress.cloud';
        this.mobileUrl = `redacted`;
    }

    /**
     * Opens the mobile chat in a popup window.
     * Creates a user if one does not exist and retrieves the user key.
     *  */

    async openMobileChat() {
        try {
            const userKey = await this.getUserKey();
            if (!userKey) {
                await this.createUser();
            }
            
            // Open mobile chat in a popup window
            chrome.windows.create({
                url: this.mobileUrl, //want to style this later
                type: 'popup',
                width: 400,
                height: 600
            });
        } catch (error) {
            console.error('Error opening mobile chat:', error);
            throw error;
        }
    }

    /**
     * Creates a new user in Botpress and stores the user key in Chrome storage.
     *  creates a post request to the Botpress API to create a user and store the key in local storage.
     * returns the user data to be used in the mobile chat function
     * returns @{object} user - The user object containing the user key and ID.
     * @throws {Error} If there is an error creating the user or storing the key.
     * */
    async createUser() {
        try {
            const options = {
                method: 'POST',
                headers: { accept: 'application/json', 'content-type': 'application/json' },
                body: JSON.stringify({ name: 'test' })
            };

            const response = await fetch(`${this.baseUrl}/${this.botId}/users`, options);
            const data = await response.json();
            
            // Store the user key in Chrome storage
            await chrome.storage.local.set({
                'botpress_user_key': data.key,
                'botpress_user_id': data.user.id
            });

            return data;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Retrieves the user key from Chrome storage.
     * if the key exists, it returns a string, if not, it returns null.
     * @returns {string|null} The user key if it exists, otherwise null.
     * @throws {Error} If there is an error retrieving the user key.
     * This function is used to check if the user key exists before creating a new user.
     * */
    async getUserKey() {
        try {
            const result = await chrome.storage.local.get(['botpress_user_key']);
            return result.botpress_user_key || null;
        } catch (error) {
            console.error('Error getting user key:', error);
            throw error;
        }
    }

}

export default BotpressChat;