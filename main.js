import { createViewer } from "./core/CesiumSetup.js";
import { fetchBackendMessage } from "./Core/BackendCheck.js";
import { latlonFromXY } from "./Core/CoordinateUtils.js";

import {
    createBox,
    createModel
} from "./Core/EntityFactory.js";

import { ToolboxController } from "./ui/ToolboxController.js";
import { AreaDrawer } from "./ui/drawing/AreaDrawer.js";
import { StructureDrawer } from "./ui/drawing/StructureDrawer.js";
import { DeleteTool } from "./ui/drawing/DeleteTool.js";
import { CameraDrawer } from "./ui/drawing/CameraDrawer.js";
import { CameraService } from "./services/CameraService.js";

import { loadAreas } from "./ui/drawing/AreaLoader.js";
import { loadStructures } from "./ui/drawing/StructureLoader.js";
import { loadCameras } from "./ui/drawing/CameraLoader.js";

window.onload = async () => {
    const viewer = createViewer();

    // Camera drawer voor interacties
    const cameraDrawer = new CameraDrawer(viewer);

    // Example entities
    const testLabelPos = latlonFromXY(220, 70);
    viewer.entities.add({
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

    // Example boxes
    createBox(viewer, 200, 300, 50, 40, 70, 0, "building_tex.jpg");
    createBox(viewer, 240, 300, 50, 40, 70, 0, "building_tex.jpg");

    // Create tool instances
    const areaDrawer = new AreaDrawer(viewer);
    const structureDrawer = new StructureDrawer(viewer);
    const deleteTool = new DeleteTool(viewer);

    // Load saved data from backend
    await loadAreas(viewer);
    await loadStructures(viewer);
    await loadCameras(viewer, cameraDrawer);

    const toolbox = new ToolboxController();

    // Camera callbacks
    toolbox.on("placeCamera", () => cameraDrawer.startPlacement());
    toolbox.on("saveCamera", () => cameraDrawer.saveCurrentCamera());

    // Connect UI actions to Cesium actions
    toolbox.on("drawArea", () => areaDrawer.start());
    toolbox.on("finishArea", () => areaDrawer.finish(prompt("Name:")));
    toolbox.on("cancelArea", () => areaDrawer.cancel());

    toolbox.on("placeBuilding", () => structureDrawer.activate("building"));
    toolbox.on("placeRoad", () => structureDrawer.activate("road"));
    toolbox.on("placeTree", () => structureDrawer.activate("tree"));

    // Delete action
    toolbox.on("delete", () => deleteTool.activate());

    // Deactivate callback
    toolbox.on("deactivate", (action) => {
        if (action === "drawArea") areaDrawer.cancel();
        structureDrawer.deactivate?.();
        deleteTool.deactivate?.();
    });

    // Models
    createModel(viewer, "Cesium_Man.glb", latlonFromXY(220, 70), 0);
    createModel(viewer, "strange_building.glb", latlonFromXY(240, 70), 0);

    // Backend test
    fetchBackendMessage(viewer);
};
