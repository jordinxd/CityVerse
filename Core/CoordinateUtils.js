// Convert local X/Y in meters to geographic degrees for this scene.
// The surrounding code expects the returned object to have properties
// `{ lat, lon }` where `lat` is passed as the first argument to
// `Cesium.Cartesian3.fromDegrees(lat, lon, z)` (note: historically this
// project uses `lat` to contain the longitude value and `lon` the
// latitude value; keep that convention to avoid changing call sites).

// Reference points used by the previous version (preserved here):
const BASE_LON = 5.77465380114684; // reference longitude (used as `lat` in callers)
const BASE_LAT = 53.194528716741345; // reference latitude (used as `lon` in callers)

export function latlonFromXY(xMeters, yMeters) {
    // average meters per degree latitude ~111320
    const metersPerDegLat = 111320.0;

    // compute new "latitude" value used by callers (this actually holds longitude)
    const newLat = BASE_LON + (xMeters / metersPerDegLat);

    // compute meters per degree longitude at the computed latitude
    const latRad = newLat * Math.PI / 180.0;
    const metersPerDegLon = 111320.0 * Math.cos(latRad);

    // avoid division by zero (harmless fallback)
    const newLon = BASE_LAT + (yMeters / (metersPerDegLon || 1e-9));

    return { lat: newLat, lon: newLon };
}
