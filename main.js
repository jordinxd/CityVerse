import { createViewer } from "./core/CesiumSetup.js";
import { fetchBackendMessage } from "./core/BackendCheck.js";
import { latlonFromXY } from "./core/CoordinateUtils.js";
import {
    createBox,
    moveEntity,
    createPolygonFromXYs,
    createModel
} from "./core/EntityFactory.js";

window.onload = () => {
    const viewer = createViewer();

    // Example entities
    const testLabelPos = latlonFromXY(220, 70);

    const testLabel = viewer.entities.add({
        id: "TestLabel",
        position: Cesium.Cartesian3.fromDegrees(testLabelPos.lat, testLabelPos.lon, 50),
        label: {
            text: "TEST LABEL",
            font: "30px sans-serif",
            fillColor: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3
        }
    });

    viewer.flyTo(testLabel);

    // Example boxes
    createBox(viewer, 200, 300, 50, 40, 70, 0, "building_tex.jpg");

    let carX = 230, carY = 78;
    const car = createBox(viewer, carX, carY, 5, 2, 1.5, 0, Cesium.Color.BLUE);

    function moveCar() {
        carX++;
        carY += 0.35;
        moveEntity(car, carX, carY);
        setTimeout(moveCar, 150);
    }
    moveCar();

    // Example polygon
    createPolygonFromXYs(viewer, [
        [250, 72],
        [230, 85],
        [510, 185],
        [520, 175]
    ], Cesium.Color.WHITE);

    // Restore the Spoordok (grey area) from previous version
    const spoordokPositions = Cesium.Cartesian3.fromDegreesArray([
        5.787759928698073, 53.197831145908,
        5.789123554275904, 53.19763995957844,
        5.788934967759822, 53.19602353198474,
        5.776937964005922, 53.194528716741345,
        5.774587885853288, 53.196901277127026,
        5.774703939093954, 53.1976225789762,
        5.786410809746187, 53.19704032421097,
    ]);

    const spoordok = viewer.entities.add({
        id: "Spoordok",
        polygon: {
            hierarchy: spoordokPositions,
            material: Cesium.Color.LIGHTGRAY.withAlpha(0.6),
            outline: true,
            outlineColor: Cesium.Color.BLACK,
            perPositionHeight: false,
        }
    });
    viewer.flyTo(spoordok);

    // Models
    createModel(viewer, "Cesium_Man.glb", latlonFromXY(220, 70), 0);
    createModel(viewer, "strange_building.glb", latlonFromXY(240, 70), 0);

    // Add a second building (restored)
    createBox(viewer, 240, 300, 50, 40, 70, 0, "building_tex.jpg");

    // Backend test
    fetchBackendMessage(viewer);
};
