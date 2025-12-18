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
import { EditorSelection } from "./ui/editor/EditorSelection.js";
import { MoveTool } from "./ui/editor/MoveTool.js";
import { RotationTool } from "./ui/editor/RotationTool.js";
import { EditorToolManager } from "./ui/editor/EditorToolManager.js";



window.onload = async () => {
import { DeleteTool } from "./ui/drawing/DeleteTool.js";


// ------------------------------------------------------------------
// 1. DE ANALYSE FUNCTIE (Nu buiten window.onload geplaatst)
// ------------------------------------------------------------------
async function startAnalysis(btnElement) {
    const card = btnElement.closest('.agent-card');
    const actionDiv = btnElement.closest('.agent-action');
    const textSpan = actionDiv.querySelector('span');
    const iconSvg = btnElement.querySelector('svg');

    textSpan.innerText = "Bezig met analyse...";
    
    iconSvg.innerHTML = '<path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/>';
    iconSvg.classList.add('spinning'); // Start draaien
    btnElement.disabled = true; // Voorkom dubbel klikken

    try {
        const response = await fetch('http://localhost:3000/api/run-ai');
        const data = await response.json(); 
        
        iconSvg.classList.remove('spinning');
        btnElement.disabled = false;

        textSpan.innerText = "Bekijk analyse";
        iconSvg.innerHTML = '<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>';

        let detailsDiv = card.querySelector('.analysis-details');
        if (!detailsDiv) {
            detailsDiv = document.createElement('div');
            detailsDiv.className = 'analysis-details';
            card.appendChild(detailsDiv);
        }

        detailsDiv.innerHTML = `
            <div><span class="score-badge">Score: ${data.quality_of_life_score}/100</span></div>
            <div><em>"${data.justification}"</em></div>
        `;

        btnElement.onclick = (e) => {
            e.stopPropagation(); // Voorkom dat andere kliks afgaan
            detailsDiv.classList.toggle('open');
            // Icoon draaien als hij open is
            btnElement.style.transform = detailsDiv.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        };

        // Open hem direct de eerste keer
        detailsDiv.classList.add('open');
        btnElement.style.transform = 'rotate(180deg)';

    } catch (error) {
        console.error(error);
        textSpan.innerText = "Fout bij analyse";
        iconSvg.classList.remove('spinning');
        btnElement.disabled = false; // Zorg dat je het opnieuw kunt proberen bij fout
    }
}


window.startAnalysis = startAnalysis;

window.onload = () => {

    // NOTE: removed global click preventDefault which interfered with
    // normal UI events (it could cancel drawing or stop button handlers).

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
    const selection = new EditorSelection(viewer);
    const moveTool = new MoveTool(viewer, selection);
    const rotationTool = new RotationTool(viewer, selection);


    const toolManager = new EditorToolManager(viewer, selection, {
    move: moveTool,
    rotate: rotationTool
});


    // Load saved areas and structures from backend
    try {
     loadAreas(viewer);
     loadStructures(viewer);
     loadCameras(viewer, cameraDrawer);
        console.log("Entities loaded from backend");
    } catch (err) {
        console.error("Failed to load entities:", err);
    }

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

    toolbox.on("move", () => toolManager.activateTool("move"));
    toolbox.on("rotate", () => toolManager.activateTool("rotate"));
    toolbox.on("scale", () => toolManager.activateTool("scale"));
    
    // Deactivate all tools when switching away from current tool
    toolbox.on("deactivate", (action) => {
        areaDrawer.cancel();
        structureDrawer.deactivate();
        deleteTool.deactivate();
        toolManager.deactivateAll();
    });

    toolbox.on("delete", () => {
        // Deactivate other tools first
        areaDrawer.cancel();
        structureDrawer.deactivate();
        toolManager.deactivateAll();
        // Then activate delete
        deleteTool.activate();
    });

    // Models
    createModel(viewer, "Cesium_Man.glb", latlonFromXY(220, 70), 0);
    createModel(viewer, "strange_building.glb", latlonFromXY(240, 70), 0);

    // Backend test
    fetchBackendMessage(viewer);
};