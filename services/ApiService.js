// Base URL for all backend API calls
export const BACKEND_URL = "http://localhost:3000";

/*
 * Simple wrapper around fetch for common HTTP methods.
 * Includes JSON parsing, basic error handling, and logging.
 */
export const Api = {

    /*
     * HTTP GET request
     * Returns parsed JSON if successful, otherwise returns null.
     */
    get: (url) => fetch(url).then(async r => {
        try {
            return await r.json();
        } catch(e) {
            // If response is not JSON, return null
            return null;
        }
    }),

    /*
     * HTTP POST request
     * Sends JSON body and attempts to parse JSON response.
     * Logs raw response for debugging purposes.
     */
    post: async (url, data) => {
        const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        // Get raw response text for debugging
        const text = await r.text();
        console.warn("RAW POST RESPONSE:", text);

        try {
            return JSON.parse(text);
        } catch (e) {
            // If parsing fails, log error and return null
            console.error("JSON PARSE FAILED", e);
            return null;
        }
    },

    /*
     * HTTP PUT request
     * Sends JSON body and attempts to parse JSON response.
     * Returns status info if no JSON content is returned (e.g., 204 No Content).
     */
    put(url, data) {
        return fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }).then(async r => {
            try {
                const text = await r.text();
                if (text) {
                    return JSON.parse(text); // Return parsed JSON
                } else {
                    // No content returned: return status for informational purposes
                    return { status: r.status, ok: r.ok };
                }
            } catch (e) {
                console.error("JSON PARSE FAILED", e);
                return null;
            }
        });
    },

    /*
     * HTTP DELETE request
     * Attempts to parse JSON response if present.
     * Otherwise returns a simple status object with HTTP status and success flag.
     */
    delete: (url) =>
        fetch(url, { method: "DELETE" })
            .then(async r => {
                try {
                    return await r.json(); // Try to parse JSON
                } catch {
                    // If no JSON is returned, return basic status info
                    return { status: r.status, ok: r.ok };
                }
            })
};
