import { latlonFromXY } from "./CoordinateUtils.js";

export async function fetchBackendMessage(viewer) {
    try {
        const response = await fetch("http://localhost:3000/api/hello");
        const data = await response.json();

        const pos = latlonFromXY(220, 70);

        const label = viewer.entities.add({
            id: "BackendLabel",
            position: Cesium.Cartesian3.fromDegrees(pos.lat, pos.lon, 80),
            label: {
                text: data.message,
                font: "30px sans-serif",
                fillColor: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: Cesium.Color.BLACK.withAlpha(0.4),
            }
        });

        viewer.flyTo(label);
    } catch (err) {
        console.error("Backend fetch failed:", err);
    }
}
