import { Api, BACKEND_URL } from "./ApiService.js";

// Base endpoint URL for Area-related requests
const BASE = `${BACKEND_URL}/areas`;

/*
 * AreaService: simple wrapper for backend Area API calls.
 * Delegates actual HTTP requests to the generic Api service.
 */
export const AreaService = {

    /*
     * Retrieves all areas from the backend.
     * Returns a Promise resolving to a list of Area objects.
     */
    getAll: () => Api.get(BASE),

    /*
     * Creates a new area in the backend.
     * Sends the area object as JSON in the request body.
     * Returns a Promise resolving to the created Area object.
     */
    create: (area) => Api.post(BASE, area),

    /*
     * Deletes an area by ID.
     * Returns a Promise resolving to the server response
     * or status info if no JSON is returned.
     */
    delete: (id) => Api.delete(`${BASE}/${id}`)
};
