//this is the content script
// will run on every page and use heuristics to check if any of the keywords and patterns are matched for phishing
console.log("Content script loaded");

/**
 * function to send current URL to the background script for Google lookup
 * Displays warning if the site is a known phishing site
 */
function googleLookup(){
    chrome.runtime.sendMessage({action: "scanURL", url: window.location.href}, response => {
        console.log("Response from API", response.result)
        if (response.Threat){
            showInlineRedPopup("This site is a known phishing site")
        }
        else{
            console.log("This site is safe")
        }
    })
}

/**
 * function to check if the current URL is in the whitelist
 * if not, then appropriate phishing detection methods are called
 * if the URL is in the whitelist, then no action is taken
 */
function isInWhitelist(){
    chrome.storage.local.get(["whitelist"]).then((result) => {
        const whitelist = result.whitelist || []; // call whitelist and put it into a variable
        const currentUrl = window.location.href; 
        if (!whitelist.includes(currentUrl)){
            googleLookup();
            extractFeatures();
        }
        else{
            console.log("Already in whitelist, for google lookup and ml model prediction")
        }
      })

}

/**
 * URL feature extraction functions
 * These functions extract various features from the URL and return their values
 */

/**
 * Extracts the length of the domain from the URL
 * @param {string} url - The URL to extract the domain length from
 * @return {number} - The length of the domain
 * */
function extractdomainLength(url) {
    const domain = new URL(url).hostname; // Extract the domain from the URL
    console.log("Domain: ", domain); // Log the domain for debugging
    return domain.length; // Return the length of the domain
}

/**
 * Extracts the length of the directory from the URL
 * @param {string} url - The URL to extract the directory length from
 * @return {number} - The length of the directory
 * */
function extractDirectoryLength(url) {
    const path = new URL(url).pathname; // Extract the path from the URL
    const directory = path.substring(0, path.lastIndexOf('/')); // Get the directory part of the path
    console.log("Directory: ", directory); // Log the directory for debugging
    return directory.length; // Return the length of the directory
}

/**
 * Extracts the length of the file from the URL
 * @param {string} url - The URL to extract the file length from
 * @return {number} - The length of the file
 * */
function extractFileLength(url) {
    const path = new URL(url).pathname; // Extract the path from the URL
    const file = path.substring(path.lastIndexOf('/') + 1); // Get the file part of the path
    if (extractDirectoryLength(url) == 0) {
        console.log("-1 no directory"); // Log for debugging
        return -1; // Return 0 if there is no directory
    }
    else{
        console.log("File: ", file); // Log the file for debugging
        return file.length; // Return the length of the file name
    }
}

/**
 * Extracts the length of the query parameters from the URL
 * @param {string} url - The URL to extract the query parameters length from
 * @return {number} - The length of the query parameters
 * */
function extractParamsLength(url) {
    const params = new URL(url).search; // Extract the query parameters from the URL
    if (params.length == 0) {
        paramslength = -1;
        return paramslength; // Return -1 if there are no parameters, this is consistent with the dataset
    }
    else{
        return params.length; // Return the length of the query parameters

    }
}

/**
 * Extracts the number of slashes in the URL path
 * @param {string} url - The URL to extract the number of slashes from
 * @return {number} - The number of slashes in the path
 * */
function extractQtySlash(url) {
    const qty_slash = url.split('/').length - 1; // Count the number of slashes in the path
    console.log("Qty slash: ", qty_slash); // Log the count of slashes
    return qty_slash; // Return the count of slashes
}

/**
 * Extracts the number of dots in the URL path
 * @param {string} url - The URL to extract the number of dots from
 * @return {number} - The number of dots in the path
 * */
function extractQtyDot(url) {
    const qty_dot = url.split('.').length - 1; // Count the number of dots in the path
    console.log("Qty dot: ", qty_dot); // Log the count of dots
    return qty_dot; // Return the count of dots
}

/**
 * Checks if the domain is an IP address
 * @param {string} url - The URL to check
 * @return {number} - 1 if the domain is an IP address, otherwise 0
 * */
function domainIsIp(url) {
    const domain = new URL(url).hostname; // Extract the domain from the URL
    const is_ip = domain.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/); // Check if the domain is an IP address
    console.log("Domain is IP: ", is_ip); // Log the result for debugging
    return is_ip ? 1 : 0; // Return 1 if it is an IP address, otherwise return 0
}

/**
 * Extracts the number of '@' symbols in the URL
 * @param {string} url - The URL to check
 * @return {number} - The number of '@' symbols in the URL
 * */
function extractQtyAt(url) {
    const qty_at = url.split('@').length - 1; // Count the number of '@' symbols in the url
    console.log("Qty at: ", qty_at); // Log the count of '@' symbols
    return qty_at; // Return the count of '@' symbols
}

/**
 * Extracts the ASN (Autonomous System Number) from the URL
 * This function is not deemed possible to implement at the moment
 * */
function extractASN_______WIP(url) {
    asn_ip = -1;
    return asn_ip; // Placeholder for ASN extraction, return a fixed value for now
    // Note: The actual ASN extraction logic is not implemented yet
}
/**
 * Extracts the number of hyphens in the URL
 * @param {string} url - The URL to check
 * @return {number} - The number of hyphens in the URL
 */
function extractQtyHyphen(url) {
    const qty_hyphen = url.split('-').length - 1; // Count the number of hyphens in the URL
    console.log("Qty hyphen: ", qty_hyphen); // Log the count of hyphens
    return qty_hyphen; // Return the count of hyphens
}

/**
 * Extracts the Google index status of the URL
 * This function is not deemed possible to implement due to terms of service issues
 * */
function extractUrlGoogleIndex_________WIP(url) {
    const url_google_index = Math.random() < 0.5 ? 0 : 1; // Randomly returns 0 or 1
    console.log("Google index: ", url_google_index); // Log the Google index status for debugging
    return url_google_index; // Return the Google index status
}

/**
 * Extracts the URL shortened status
 */
function extractUrlShortened_________WIP(url) {
    const url_shortened = 0; // Placeholder for URL shortening check, return a fixed value for now
    return url_shortened; // Return the URL shortened status
}

/**
 * Gets domain details from the background script
 * This function sends a message to the background script to extract domain details
 * */
function getDomainDetailsFromBackground(domain) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "extractDomainDetails", url: domain }, response => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response); // { estimatedDomainAge, expirationDate }
            }
        });
    });
}

/**
 * Checks for homoglyphs in the URL
 * @param {string} url - The URL to check for homoglyphs
 * @return {boolean} - True if homoglyphs are detected, otherwise false
 * */
function checkForHomoglyphs(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();
            
            // Check for Punycode (encoded Unicode)
        if (domain.includes('xn--')) {
            return true;
        }

            // Check for mixed Unicode scripts
        if (domain !== domain.normalize('NFKC')) {
            return true;
        }

        return false;
    } catch (error) {
        return true; // If URL parsing fails, assume it's a homoglyph
    // This is a conservative approach to avoid false negatives
    }
}


/**
 * Converts expiration date into days until expiration
 * @param {string} expirationDateString - The expiration date string to convert
 * @return {number} - The number of days until expiration, -1 is returned if the date is not valid, consistent with the dataset
 * */
function calculateDaysUntilExpiration(expirationDateString) {
    if (!expirationDateString) return -1;

    const now = new Date();
    const expirationDate = new Date(expirationDateString);
    
    const diffTime = expirationDate - now;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    console.log("Days until expiration: ", diffDays); // Log the difference in days for debugging
    
    return diffDays > 0 ? diffDays : 0;
}

/**
 * Master function to extract features from the URL
 * This function orchestrates the feature extraction process and sends the features to the API
 * */
async function extractFeatures(){
        const url = window.location.href; // Get the current URL
        if (url === "Redacted"){ //so predictions aren't run on chatbot
            return;
        }
        try {
            if (checkForHomoglyphs(url) === true) {
                showInlineRedPopup("This URL contains homographs, which may indicate a phishing attempt.");
                return; // Exit if homoglyphs are detected
            } else if (checkForHomoglyphs(url) === false) {
                console.log("No homoglyphs detected in the URL.");
            } else {
                console.log("Homoglyph check returned an unexpected result:", checkForHomoglyphs(url));
            }
        }
            catch (error) {
                console.error("Error checking for homoglyphs:", error);
                return; // Exit if there's an error in the homoglyph check
            }         


        const domain = new URL(url).hostname; // Extract the domain from the URL
        let domainDetails = { estimatedDomainAge: 0, expirationDate: null };
        try {
            domainDetails = await getDomainDetailsFromBackground(domain);
        } catch (err) {
            console.error("Failed to get domain details:", err);
        } 
        const expirationInDays = calculateDaysUntilExpiration(domainDetails.expirationDate);  
        const features = {
            length_url: url.length,
            domain_length: extractdomainLength(url),
            directory_length: extractDirectoryLength(url),
            file_length: extractFileLength(url),
            params_length: extractParamsLength(url),
            qty_slash_url: extractQtySlash(url),
            qty_dot_url: extractQtyDot(url),
            domain_in_ip: domainIsIp(url),
            qty_at_url: extractQtyAt(url),
            asn_ip: await extractASN_______WIP(url),
            time_domain_activation: domainDetails.estimatedDomainAge,
            time_domain_expiration: expirationInDays,
            qty_hyphen_url: extractQtyHyphen(url),
            url_google_index: extractUrlGoogleIndex_________WIP(url),
            url_shortened: extractUrlShortened_________WIP(url)
        };
        console.log("Extracted features: ", features); // Log the extracted features for debugging
    
        // Send features to Flask API
        sendFeaturesToAPI(features);
    } //figure out promise and error handling for this function

/**
 * Sends the extracted features to the Flask API for prediction
 * @param {Object} features - The extracted features to send
 * @return {object} - The prediction result from the API
 * @throws {Error} - Throws an error if the API request fails
 * */
async function sendFeaturesToAPI(features) {
    try {
        const response = await fetch('http://127.0.0.1:5000/predict', { //Local Url
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(features)
        });

        const result = await response.json();
        console.log('API Response:', result);
        const prediction = Number(result.prediction); // The API returns a json object with prediction

        if (prediction === 1) {
            showInlineRedPopup("This site could potentially be phishing!");
        } else if (prediction === 0) {
            console.log("This site is safe from ML model prediction");
        } else {
            console.log("Unknown prediction result:", prediction, typeof prediction);
        }
    } catch (error) {
        console.error('Error sending features to API:', error);
    }
}


/**
 * Displays a red popup message on the page
 * @param {string} message - The message to display in the popup
 * */

function showInlineRedPopup(message) {
    const popup = document.createElement("div");
    
    // Create container with flexbox for better layout
    popup.style = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: red;
        color: white;
        padding: 50px;
        z-index: 9999;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 200px;
    `;

    // Create message container
    const messageDiv = document.createElement("div");
    messageDiv.textContent = message;
    messageDiv.style.fontWeight = "bold";
    
    // Create close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "✕";
    closeButton.style = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        padding: 5px;
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    `;


    // Add click handler to close button
    closeButton.addEventListener('click', () => popup.remove());

    // Append elements
    popup.appendChild(closeButton);
    popup.appendChild(messageDiv);
    document.body.appendChild(popup);

    // Still keep the auto-remove after 10 seconds
    setTimeout(() => {
        if (document.body.contains(popup)) {
            popup.remove();
        }
    }, 10000);
}

isInWhitelist();
