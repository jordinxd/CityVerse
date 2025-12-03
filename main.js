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
import { DeleteTool } from "./ui/drawing/DeleteTool.js";


window.onload = () => {

    // NOTE: removed global click preventDefault which interfered with
    // normal UI events (it could cancel drawing or stop button handlers).

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

    // Create tool instances
    const areaDrawer = new AreaDrawer(viewer);
    const structureDrawer = new StructureDrawer(viewer);
    const deleteTool = new DeleteTool(viewer);

    loadAreas(viewer); // Load saved areas on startup
    loadStructures(viewer);

    const toolbox = new ToolboxController();

    // Connect UI actions to Cesium actions
    toolbox.on("drawArea", () => areaDrawer.start());
    toolbox.on("finishArea", () => areaDrawer.finish(prompt("Name:")));
    toolbox.on("cancelArea", () => areaDrawer.cancel());

    toolbox.on("placeBuilding", () => structureDrawer.activate("building"));
    toolbox.on("placeRoad", () => structureDrawer.activate("road"));
    toolbox.on("placeTree", () => structureDrawer.activate("tree"));

    // Delete action name used by ToolboxController is "delete"
    toolbox.on("delete", () => deleteTool.activate());

    // Deactivate callback is called by ToolboxController when buttons toggle off
    toolbox.on("deactivate", (action) => {
        // If an area draw was active, cancel it
        if (action === "drawArea") areaDrawer.cancel();
        // If a structure tool was active, attempt to deactivate it
        structureDrawer.deactivate?.();
        // Deactivate delete tool if it was active
        deleteTool.deactivate?.();
    });


    // Models
    createModel(viewer, "Cesium_Man.glb", latlonFromXY(220, 70), 0);
    createModel(viewer, "strange_building.glb", latlonFromXY(240, 70), 0);

    // Add a second building (restored)
    createBox(viewer, 240, 300, 50, 40, 70, 0, "building_tex.jpg");

    // Backend test
    fetchBackendMessage(viewer);
};
