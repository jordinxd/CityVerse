import { createViewer } from "./core/CesiumSetup.js";
import { fetchBackendMessage } from "./Core/BackendCheck.js";
import { latlonFromXY } from "./Core/CoordinateUtils.js";

import { createBox, createModel } from "./Core/EntityFactory.js";

import { ToolboxController } from "./ui/ToolboxController.js";
import { AreaDrawer } from "./ui/drawing/AreaDrawer.js";
import { StructureDrawer } from "./ui/drawing/StructureDrawer.js";
import { DeleteTool } from "./ui/drawing/DeleteTool.js";
import { CameraDrawer } from "./ui/drawing/CameraDrawer.js";
// import { CameraService } from "./services/CameraService.js";

import { loadAreas } from "./ui/drawing/AreaLoader.js";
import { loadStructures } from "./ui/drawing/StructureLoader.js";
import { loadCameras } from "./ui/drawing/CameraLoader.js";
import { EditorSelection } from "./ui/editor/EditorSelection.js";
import { MoveTool } from "./ui/editor/MoveTool.js";
import { RotationTool } from "./ui/editor/RotationTool.js";
import { EditorToolManager } from "./ui/editor/EditorToolManager.js";


// --- ANALYSE FUNCTIE (Globaal) ---
async function startAnalysis(btnElement) {
    const card = btnElement.closest('.agent-card');
    const actionDiv = btnElement.closest('.agent-action');
    const textSpan = actionDiv.querySelector('span');
    const iconSvg = btnElement.querySelector('svg');

    textSpan.innerText = "Bezig met analyse...";
    iconSvg.innerHTML = '<path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/>';
    iconSvg.classList.add('spinning'); 
    btnElement.disabled = true; 

    try {
        const response = await fetch('http://localhost:8080/api/run-ai');
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
            e.stopPropagation(); 
            detailsDiv.classList.toggle('open');
            btnElement.style.transform = detailsDiv.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        };

        detailsDiv.classList.add('open');
        btnElement.style.transform = 'rotate(180deg)';

    } catch (error) {
        console.error(error);
        textSpan.innerText = "Fout bij analyse";
        iconSvg.classList.remove('spinning');
        btnElement.disabled = false; 
    }
}
window.startAnalysis = startAnalysis;


// --- MAIN INITIALISATIE ---
window.onload = () => {

    const viewer = createViewer();

    // 1. Initialiseer CameraDrawer
    const cameraDrawer = new CameraDrawer(viewer);

    // Example entities
    const testLabelPos = latlonFromXY(220, 70);
    viewer.entities.add({
        id: "TestLabel",
        position: Cesium.Cartesian3.fromDegrees(testLabelPos.lat, testLabelPos.lon, 50),
        label: {
            // text: "TEST LABEL",
            // font: "30px sans-serif",
            // fillColor: Cesium.Color.YELLOW,
            // outlineColor: Cesium.Color.BLACK,
            // outlineWidth: 3
        }
    });

    createBox(viewer, 200, 300, 50, 40, 70, 0, "building_tex.jpg");
    createBox(viewer, 240, 300, 50, 40, 70, 0, "building_tex.jpg");

    // Tools
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

    // Area drawing with save
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
                const response = await fetch("http://localhost:8080/areas", {
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

    // Backend test
    fetchBackendMessage(viewer);


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

    // 2. TAB FUNCTIONALITEIT (NIEUW TOEGEVOEGD)
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // A. Verwijder 'active' class van alle knoppen
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // B. Voeg 'active' class toe aan de aangeklikte knop
            button.classList.add('active');

            // C. Verberg alle secties
            tabSections.forEach(section => section.style.display = 'none');

            // D. Toon de juiste sectie op basis van data-tab attribuut
            const targetId = button.getAttribute('data-tab');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
            
            // Optioneel: Verberg de "Plaats Agent" knop als je in de Gegevens tab zit
            if (targetId === 'tab-gegevens') {
                if(btnAgentPlaatsen) btnAgentPlaatsen.style.display = 'none';
            } else {
                if(btnAgentPlaatsen) btnAgentPlaatsen.style.display = 'block';
            }
        });
    });
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

    // Optioneel: Open de eerste categorie standaard bij laden
    if(acc.length > 0) {
        acc[0].click();
    }
};