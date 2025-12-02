import { Api } from "./ApiService.js";

const BASE = "http://localhost:3000/areas";

export const AreaService = {
    getAll: () => Api.get(BASE),
    create: (area) => Api.post(BASE, area),
    delete: (id) => Api.delete(`${BASE}/${id}`)
};
