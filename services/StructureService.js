import { Api } from "./ApiService.js";

const BASE = "http://localhost:3000/structures";

export const StructureService = {
    getAll: () => Api.get(BASE),
    create: (s) => Api.post(BASE, s),
    update: (id, s) => Api.put(`${BASE}/${id}`, s),
    delete: (id) => Api.delete(`${BASE}/${id}`)
};
