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


// ------------------------------------------------------------------
// 1. DE ANALYSE FUNCTIE (Nu buiten window.onload geplaatst)
// ------------------------------------------------------------------
async function startAnalysis(btnElement) {
    // 1. Vind de parent container (agent-card) en de text span
    const card = btnElement.closest('.agent-card');
    const actionDiv = btnElement.closest('.agent-action');
    const textSpan = actionDiv.querySelector('span');
    const iconSvg = btnElement.querySelector('svg');

    // 2. STATUS: LADEN (Zandloper)
    textSpan.innerText = "Bezig met analyse...";
    
    // Verander icoon naar zandloper (Hourglass)
    iconSvg.innerHTML = '<path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/>';
    iconSvg.classList.add('spinning'); // Start draaien
    btnElement.disabled = true; // Voorkom dubbel klikken

    try {
        // 3. ROEP BACKEND AAN (Hier voert Java de ai.py uit)
        // Let op: pas de URL aan naar jouw Spring Boot endpoint
        const response = await fetch('http://localhost:3000/api/run-ai');
        const data = await response.json(); 
        
        // 4. STATUS: KLAAR (Dropdown modus)
        iconSvg.classList.remove('spinning');
        btnElement.disabled = false;

        // Verander tekst en icoon naar 'Dropdown pijl'
        textSpan.innerText = "Bekijk analyse";
        iconSvg.innerHTML = '<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>';

        // 5. INJECTEER DE RESULTATEN (Als ze er nog niet zijn)
        let detailsDiv = card.querySelector('.analysis-details');
        if (!detailsDiv) {
            detailsDiv = document.createElement('div');
            detailsDiv.className = 'analysis-details';
            card.appendChild(detailsDiv);
        }

        // Vul de data in
        detailsDiv.innerHTML = `
            <div><span class="score-badge">Score: ${data.quality_of_life_score}/100</span></div>
            <div><em>"${data.justification}"</em></div>
        `;

        // 6. MAAK DE KNOP KLIKBAAR VOOR DROPDOWN
        // We verwijderen de oude onclick en zetten er een toggle functie op
        btnElement.onclick = (e) => {
            e.stopPropagation(); // Voorkom dat andere kliks afgaan
            detailsDiv.classList.toggle('open');
            // Icoon draaien als hij open is (optioneel)
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