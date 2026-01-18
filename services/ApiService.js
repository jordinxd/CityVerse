export const BACKEND_URL = "http://localhost:8080";

export const Api = {
    get: (url) => fetch(url).then(async r => {
        try { return await r.json(); } catch(e) { return null; }
    }),

    post: async (url, data) => {
        const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const text = await r.text();
        console.warn("RAW POST RESPONSE:", text);

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("JSON PARSE FAILED", e);
            return null;
        }
    },

    put(url, data) {
        return fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }).then(async r => {
            try {
                const text = await r.text();
                if (text) {
                    return JSON.parse(text);
                } else {
                    // Return success response if no content is returned (e.g., 204 No Content)
                    return { status: r.status, ok: r.ok };
                }
            } catch (e) {
                console.error("JSON PARSE FAILED", e);
                return null;
            }
        });
    },
    delete: (url) =>
        fetch(url, { method: "DELETE" })
            .then(async r => {
                try { return await r.json(); }
                catch { return { status: r.status, ok: r.ok }; }
            })
};
