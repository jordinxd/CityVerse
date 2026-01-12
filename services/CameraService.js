import { Api } from "./ApiService.js";

const BASE = "http://localhost:3000/cameras";

export const CameraService = {
    getAll: () => Api.get(BASE),
    create: (cam) => {
        // Generate a UUID if not provided
        if (!cam.id) {
            cam.id = crypto.randomUUID();
        }
        return Api.post(BASE, cam);
    },
    update: (id, cam) => Api.put(`${BASE}/${id}`, cam),
    delete: (id) => Api.delete(`${BASE}/${id}`),
    getById: (id) => Api.get(`${BASE}/${id}`)
};
