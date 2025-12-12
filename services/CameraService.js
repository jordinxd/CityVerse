import { Api } from "./ApiService.js";

const BASE = "http://localhost:3000/cameras";

export const CameraService = {
    getAll: () => Api.get(BASE),
    create: (cam) => Api.post(BASE, cam),
    delete: (id) => Api.delete(`${BASE}/${id}`)
};
