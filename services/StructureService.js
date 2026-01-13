import { Api, BACKEND_URL } from "./ApiService.js";

const BASE = `${BACKEND_URL}/structures`;

export const StructureService = {
    getAll: () => Api.get(BASE),
    create: (s) => Api.post(BASE, s),
    update: (id, s) => Api.put(`${BASE}/${id}`, s),
    delete: (id) => Api.delete(`${BASE}/${id}`)
};
