import { createViewer } from "./core/CesiumSetup.js";
import { fetchBackendMessage } from "./core/BackendCheck.js";
import { latlonFromXY } from "./core/CoordinateUtils.js";
import {
    createBox,
    moveEntity,
    createPolygonFromXYs,
    createModel
} from "./core/EntityFactory.js";

import { ToolboxController } from "./ui/ToolboxController.js";
import { AreaDrawer } from "./ui/drawing/AreaDrawer.js";
import { loadAreas } from "./ui/drawing/AreaLoader.js";
import { StructureDrawer } from "./ui/drawing/StructureDrawer.js";
import { loadStructures } from "./ui/drawing/StructureLoader.js";
// import { DeleteController } from "./ui/drawing/DeleteController.js";


window.onload = () => {

    document.addEventListener("click", (e) => {
    e.preventDefault();
}, {capture: true});


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

    const toolbox = new ToolboxController();
   
    // Connect UI actions to Cesium actions
    toolbox.on("drawArea", () => areaDrawer.start());
    toolbox.on("finishArea", () => {
        const name = prompt("Enter area name:");
        if (name) areaDrawer.finish(name);
    });

    toolbox.on("cancelArea", () => areaDrawer.cancel());

    toolbox.on("placeBuilding", () => structureDrawer.activate("building"));
    toolbox.on("placeTree", () => structureDrawer.activate("tree"));
    toolbox.on("placeRoad", () => structureDrawer.activate("road"));

    toolbox.on("deleteEntity", () => deleteController.start());

    const areaDrawer = new AreaDrawer(viewer);
    loadAreas(viewer); // Load saved areas on startup
    const structureDrawer = new StructureDrawer(viewer);
    loadStructures(viewer);


    // Models
    createModel(viewer, "Cesium_Man.glb", latlonFromXY(220, 70), 0);
    createModel(viewer, "strange_building.glb", latlonFromXY(240, 70), 0);

    // Add a second building (restored)
    createBox(viewer, 240, 300, 50, 40, 70, 0, "building_tex.jpg");

    // Backend test
    fetchBackendMessage(viewer);
};
