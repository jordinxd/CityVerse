export const Api = {
    get: (url) => fetch(url).then(r => r.json()),
    post: (url, data) =>
        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }).then(r => r.json())
};
