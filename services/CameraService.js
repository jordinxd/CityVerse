import { Api, BACKEND_URL } from "./ApiService.js";

const BASE = `${BACKEND_URL}/camera`;

export const CameraService = {
    getAll: () => Api.get(BASE),
    create: (cam) => Api.post(BASE, cam),
    delete: (id) => Api.delete(`${BASE}/${id}`)
};
