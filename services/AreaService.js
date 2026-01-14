import { Api, BACKEND_URL } from "./ApiService.js";

const BASE = `${BACKEND_URL}/areas`;

export const AreaService = {
    getAll: () => Api.get(BASE),
    create: (area) => Api.post(BASE, area),
    delete: (id) => Api.delete(`${BASE}/${id}`)
};