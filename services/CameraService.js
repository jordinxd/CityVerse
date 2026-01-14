import { Api, BACKEND_URL } from "./ApiService.js";

const BASE = `${BACKEND_URL}/cameras`;

export const CameraService = {
    getAll: () => Api.get(BASE),
    create: (cam) => {
        // Generate an ID if not provided (using crypto.randomUUID or fallback)
        if (!cam.id) {
            cam.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        }
        return Api.post(BASE, cam);
    },
    update: (id, cam) => Api.put(`${BASE}/${id}`, cam),
    delete: (id) => Api.delete(`${BASE}/${id}`),
    getById: (id) => Api.get(`${BASE}/${id}`)
};
