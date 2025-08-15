import BotpressChat from './services/botpress-chat.js';


// Get the button and save as a variable
const whitelistButton = document.getElementById("whitelist");
const showWhitelistButton = document.getElementById("showWhitelist");

// Use an event listener to listen for clicks
/* upon clicking the whitelist button, it will retrieve the active tab's URL
* and send a message to the background script to add the URL to the whitelist
* URLs are sanitised before being sent to prevent XSS attacks
*a success message is displayed if the URL is added successfully
*/

whitelistButton.addEventListener("click", async () => {
    try {
        const tabs = await chrome.tabs.query({'active': true});
        if (!tabs || tabs.length === 0) {
            throw new Error('No active tab found');
        }
        
        const url = tabs[0].url;
        const response = await chrome.runtime.sendMessage({
            action: "addToWhitelist", 
            url: sanitizeHTML(url) // Sanitize the URL before sending
        });
        
        if (response.success) {
            alert("Site added to whitelist");
        } else {
            console.error("Whitelist error:", response.reason);
            alert("Failed to add to whitelist: " + response.reason);
        }
    } catch (error) {
        console.error("Whitelist operation failed:", error);
        alert("Failed to perform whitelist operation");
    }
});

/** The showWhitelistButton toggles the display of the whitelist container
 * updates the button text and calls the showWhitelist function to display the current whitelist
 * */
showWhitelistButton.addEventListener("click", () => {
    var state = document.getElementById("whitelistContainer"); //fix all the variable names
    if (state.style.display === "none") {
        state.style.display = "block";
        showWhitelistButton.innerText = "Hide Whitelist";
        showWhitelist();

    } else {
        state.style.display = "none";
        showWhitelistButton.innerText = "Show Whitelist";
    }
});

/**
 * * Function to display the whitelist items in the UI
 * * It retrieves the whitelist from local storage, creates DOM elements for each URL,
 * * and appends them to the whitelist container.
 *  
 */
async function showWhitelist() {
    const whitelistContainer = document.getElementById("whitelistContainer");
    
    // Clear container safely
    while (whitelistContainer.firstChild) {
        whitelistContainer.removeChild(whitelistContainer.firstChild);
    }
    
    try {
        const result = await chrome.storage.local.get(["whitelist"]);
        const whitelist = result.whitelist || [];
        const container = document.createDocumentFragment();
        
        if (whitelist.length > 0) {
            whitelist.forEach(whitelistedSite => {
                try {
                    // Validate URL before creating item
                    new URL(whitelistedSite); // This will throw if invalid
                    const listEntry = createWhitelistItem(whitelistedSite);
                    container.appendChild(listEntry);
                } catch (error) {
                    console.error(`Invalid URL skipped: ${whitelistedSite}`);
                }
            });
        } else {
            container.appendChild(noItems());
        }
        
        whitelistContainer.appendChild(container);
    } catch (error) {
        console.error('Error displaying whitelist:', error);
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = 'Error loading whitelist';
        whitelistContainer.appendChild(errorElement);
    }
}

/**
 * * Function to create a DOM element for the "No items" message
 * * It is displayed when the whitelist is empty.
 * */
function noItems() {
        const noItems = document.createElement('div');
        noItems.className = 'no-items';
        
        const span = document.createElement('span');
        span.className = 'no-items-text';
        span.textContent = 'No items in whitelist';
        
        noItems.appendChild(span);
        return noItems;
    }

/**
 * * Function to create a DOM element for each whitelisted URL
 * * It includes the URL text and a delete button to remove the URL from the whitelist.
 * * @param {string} url - The URL to be displayed
 * */    
function createWhitelistItem(url) {
        const whitelistedItem = document.createElement('div');
        whitelistedItem.className = 'whitelist-item';
        
        // Create and append URL text span
        const urlSpan = document.createElement('span');
        urlSpan.className = 'url-text';
        urlSpan.textContent = sanitizeHTML(url);
        whitelistedItem.appendChild(urlSpan);
        
        // Create and append delete button
        const deleteButton = document.createElement('span');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Remove';
        deleteButton.addEventListener('click', () => removeFromWhitelist(url));
        whitelistedItem.appendChild(deleteButton);
        
        return whitelistedItem;
    }

/**
 * * Function to sanitize a string to prevent XSS attacks
 * * It creates a temporary DOM element, sets its text content to the string,
 * needs a bit more work to be more robust
 * */    
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.textContent;
}


/**
 * * Function to remove a URL from the whitelist
 * * It retrieves the current whitelist from local storage, filters out the URL to be removed,
 * */
function removeFromWhitelist(urlToRemove) { //I really want to clean this function up
    chrome.storage.local.get(['whitelist']).then((result) => { //fix variable names in this
        const whitelist = result.whitelist || [];
        const updatedWhitelist = whitelist.filter(url => url !== urlToRemove);
        
        chrome.storage.local.set({ whitelist: updatedWhitelist }, () => {
            console.log('URL removed from whitelist:', urlToRemove);
            showWhitelist(); // Refresh the display
        });
    });}


//listens for the click event on the chatbot button
// when clicked, it creates a new instance of the BotpressChat class and calls the openMobileChat method
document.getElementById('chatbot').addEventListener('click', async () => {
        const botpress = new BotpressChat();
        await botpress.openMobileChat();
    });
