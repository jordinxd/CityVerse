import { createViewer } from "./core/CesiumSetup.js";
import { fetchBackendMessage } from "./Core/BackendCheck.js";
import { latlonFromXY } from "./Core/CoordinateUtils.js";

import { createBox, createModel } from "./Core/EntityFactory.js";

// UI Imports
import { ToolboxController } from "./ui/ToolboxController.js";
import { AreaDrawer } from "./ui/drawing/AreaDrawer.js";
import { StructureDrawer } from "./ui/drawing/StructureDrawer.js";
import { CameraDrawer } from "./ui/drawing/CameraDrawer.js";

// Data loading imports
import { loadAreas } from "./ui/drawing/AreaLoader.js";
import { loadStructures } from "./ui/drawing/StructureLoader.js";
import { loadCameras } from "./ui/drawing/CameraLoader.js";

// Editor imports
import { EditorSelection } from "./ui/editor/EditorSelection.js";
import { EditorToolManager } from "./ui/editor/EditorToolManager.js";
import { DeleteTool } from "./ui/drawing/DeleteTool.js";
import { MoveTool } from "./ui/editor/MoveTool.js";
import { RotationTool } from "./ui/editor/RotationTool.js";
import { SidebarController } from "./ui/SidebarController.js";


// --- MAIN INITIALISATIE ---
window.onload = () => {

    const viewer = createViewer();


   

    // Create tool instances
    // Pass the selection to cameraDrawer after both are initialized to avoid circular dependency
    const cameraDrawer = new CameraDrawer(viewer);
    const areaDrawer = new AreaDrawer(viewer);
    const structureDrawer = new StructureDrawer(viewer);
    const deleteTool = new DeleteTool(viewer);
    const moveTool = new MoveTool(viewer, null); // Initialize without selection first
    const rotationTool = new RotationTool(viewer, null); // Initialize without selection first
    const selection = new EditorSelection(viewer, moveTool, rotationTool, cameraDrawer);
    cameraDrawer.editorSelection = selection;
    moveTool.selection = selection; // Now set the reference
    rotationTool.selection = selection; // Now set the reference

    // createBox(viewer, 200, 300, 50, 40, 70, 0, "building_tex.jpg");
    // createBox(viewer, 240, 300, 50, 40, 70, 0, "building_tex.jpg");

    // Create tool instances
    const toolManager = new EditorToolManager(viewer, selection, {
        move: moveTool,
        rotate: rotationTool
    });

     //Sidebar logics
    const sidebar = new SidebarController({
        onPlaceAgent: () => {
            areaDrawer.cancel();
            structureDrawer.deactivate();
            toolManager.deactivateAll();
            cameraDrawer.startPlacement();
        },
        cameraDrawer: cameraDrawer
    });

    // Load saved entities
    try {
        loadAreas(viewer);
        loadStructures(viewer);
        loadCameras(viewer, cameraDrawer);
        console.log("Entities loaded from backend");
    } catch (err) {
        console.error("Failed to load entities:", err);
    }

    const toolbox = new ToolboxController();

    // Camera
    toolbox.on("placeCamera", () => cameraDrawer.startPlacement());
    toolbox.on("saveCamera", () => cameraDrawer.saveCurrentCamera());
    toolbox.on("flyToCamera", () => cameraDrawer.flyToCamera());
    toolbox.on("screenshotCamera", () => cameraDrawer.takeScreenshot());

    // Connect UI actions to Cesium actions
    toolbox.on("drawArea", () => areaDrawer.start());
    toolbox.on("finishArea", async () => {
        const name = prompt("Name:");
        if (!name) return;

        let polygon = areaDrawer.finish(name);
        if (!Array.isArray(polygon)) polygon = [];

        polygon = polygon.map(cart => {
            const c = Cesium.Cartographic.fromCartesian(cart);
            return [Cesium.Math.toDegrees(c.latitude), Cesium.Math.toDegrees(c.longitude)];
        });

        if (polygon.length > 0) {
            try {
                const response = await fetch("http://localhost:8081/areas", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name, polygon: polygon })
                });
                const saved = await response.json();
                console.log("Area saved to backend:", saved);
            } catch (err) {
                console.error("Failed to save area:", err);
            }
        }
    });
    toolbox.on("cancelArea", () => areaDrawer.cancel());

    // Structure placement
    toolbox.on("placeBuilding", () => structureDrawer.activate("building"));
    toolbox.on("placeRoad", () => structureDrawer.activate("road"));
    toolbox.on("placeTree", () => structureDrawer.activate("tree"));

    toolbox.on("move", () => toolManager.activateTool("move"));
    toolbox.on("rotate", () => toolManager.activateTool("rotate"));
    toolbox.on("scale", () => toolManager.activateTool("scale"));
    
    // Deactivate all tools when switching away via Toolbox
    toolbox.on("deactivate", (action) => {
        areaDrawer.cancel();
        structureDrawer.deactivate();
        deleteTool.deactivate();
        toolManager.deactivateAll();
    });

    toolbox.on("delete", () => {
        areaDrawer.cancel();
        structureDrawer.deactivate();
        toolManager.deactivateAll();
        deleteTool.activate();
    });


    // Models
    createModel(viewer, "Cesium_Man.glb", latlonFromXY(220, 70), 0);
    createModel(viewer, "strange_building.glb", latlonFromXY(240, 70), 0);

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(5.7804619, 53.196691, 500),
        duration: 2
    });

    // Backend test
    // fetchBackendMessage(viewer);


    // --- SIDEBAR FUNCTIONALITEIT ---

    // 1. Plaats Agent knop
    const btnAgentPlaatsen = document.getElementById("btnAgentPlaatsen");
    if (btnAgentPlaatsen) {
        btnAgentPlaatsen.onclick = () => {
            console.log("Plaats Agent knop ingedrukt");
            areaDrawer.cancel();
            structureDrawer.deactivate();
            deleteTool.deactivate();
            toolManager.deactivateAll();
            cameraDrawer.startPlacement();
        };
    }

    // --- ACCORDION FUNCTIONALITEIT ---
    const acc = document.getElementsByClassName("accordion");
    
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            // 1. Toggle de 'active' class voor de styling (plus/min teken)
            this.classList.toggle("active");

            // 2. Toggle het paneel eronder
            const panel = this.nextElementSibling;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
            }
        });
    }

};