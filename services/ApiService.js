export const Api = {
    get: (url) => fetch(url).then(r => r.json()),
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
    delete: (url) =>
        fetch(url, {
            method: "DELETE"
        }).then(r => r.json())
};
