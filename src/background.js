//Background scripts are loaded and run continuously in the background
//this will listen to messages from the context script to make calls to the Google Safe Browsing API
import RateLimiter from './services/ratelimiter.js'; // Import the rate limiter module

console.log("Background script loaded");

/**
 * * Function to check if a URL is malicious using Google Safe Browsing API
 * * @param {string} url - The URL to check for threats
 * POST request to the Google Safe Browsing API
 * returns {Promise<Object>} containing threat status
 * @property {array} [matches] - Array of threat matches found
 * If there were matches found, threat is true, else false
 * * @throws {Error} - Throws an error if the API request fails or rate limit is exceeded
 */
async function safebrowsingLookup(url) {
    if (!RateLimiter.canMakeRequest('safebrowsing')){
        throw new Error("Rate limit exceeded. Please try again later.");
    } 

    const apiKey = "Redacted";
    const apiUrl = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + apiKey;
    const requestBody = {
        "client": {
          "clientId": "anti-phishing-extension",
          "clientVersion": "1.0"
        },
        "threatInfo": {
          "threatTypes":      ["MALWARE", "SOCIAL_ENGINEERING", "PHISHING"],
          "platformTypes":    ["WINDOWS"],
          "threatEntryTypes": ["URL"],
          "threatEntries": [{"url": url }]
        }
    };
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log("Search done for URL:", url);

        // Check if the 'matches' property exists in the response
        if (data.matches  && data.matches.length > 0) {
            console.log("Threats found:", data.matches);
            return { Threat: true, matches: data.matches }; // Return the matches
        } else {
            console.log("No threats found");
            return { Threat: false }; // No threats detected
        }
    } catch (error) {
        console.error("Error during Safe Browsing API lookup:", error);
        return { Threat: false, error: error.message }; // Return error details
    }
}

/**
 * * Function to add a URL to the whitelist in local storage
 * * @param {string} url - The URL to add to the whitelist
 * * @returns {Promise<Object>} - Returns a promise that resolves to an object indicating success or failure
 * * @property {boolean} success - Indicates if the URL was successfully added to the whitelist
 * * @property {string} [reason] - Reason for failure, if applicable
 * * @throws {Error} - Throws an error if the API request fails or rate limit is exceeded
 */

async function addtoWhitelist(url) {
    try {
        const result = await chrome.storage.local.get(["whitelist"]);
        const whitelist = result.whitelist || [];
        
        if (!whitelist.includes(url)) {
            whitelist.push(url);
            await chrome.storage.local.set({ whitelist }); // Save the updated whitelist to local storage
            console.log(`URL added to whitelist: ${url}`);
            return { success: true };
        } else {
            console.log("Already in whitelist");
            return { success: false, reason: 'URL already in whitelist' };
        }
    } catch (error) {
        console.error("Error modifying whitelist:", error);
        return { success: false, error: error.message };
    }
}

// Combine the message listeners into one
// run different functions based on the message received
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try{
                if (message.action === "addToWhitelist") {
                    addtoWhitelist(message.url).then(result => {
                        sendResponse(result);  // This will send back {success: true/false} and any error messages
                    }).catch(error => {
                        sendResponse({ success: false, error: error.message });
                    });
                } else if (message.action === "scanURL") {
                    safebrowsingLookup(message.url).then((result) => {
                        sendResponse(result); // Send the result back to the sender
                    }).catch((error) => {
                        sendResponse({ Threat: false, error: error.message }); 
                    });
                } else if (message.action === "extractDomainDetails"){
                    getDomainDetails(message.url).then(result => {
                        sendResponse(result); // returns { estimatedDomainAge, expirationDate }
                    }).catch(() => {
                        sendResponse({ estimatedDomainAge: 0, expirationDate: null });
                    });
                }
            }catch (error) {
                console.error("Error in message listener:", error);
                sendResponse({ success: false, error: error.message });
            }
    return true; // Keep the message channel open for asynchronous responses
});



/**
 * * Function to get domain details using WhoisXML API
 * * @param {string} url - The URL to extract domain details from
 * @returns {estimatedDomainAge, expirationDate} - Estimated domain age and expiration date
 * * @throws {Error} - Throws an error if the API request fails or rate limit is exceeded, returns default values
 */
async function getDomainDetails(url){
    if (!RateLimiter.canMakeRequest('domainDetails')){
        throw new Error("Rate limit exceeded. Please try again later.");
    }
    
    const domain = url
    const apiKey = "Redacted";
    const apiUrl = "https://www.whoisxmlapi.com/whoisserver/WhoisService";
    const requestBody = {
        "apiKey": apiKey,
        "domainName": domain,
        "outputFormat": "JSON",
    }
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });
        const data = await response.json();
        const estimatedDomainAge = data.WhoisRecord?.estimatedDomainAge || 0;
        const expirationDate = data.WhoisRecord?.expiresDate || null;
        console.log("Domain details:", estimatedDomainAge, expirationDate);
        return { estimatedDomainAge, expirationDate };
    }
    catch (error) {
        console.error("Error during domain details lookup:", error);
        return { estimatedDomainAge: 0, expirationDate: null };
    }
}








