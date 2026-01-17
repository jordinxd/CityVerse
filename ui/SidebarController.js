import {
    CameraService
} from "../services/CameraService.js";

/**
 * Manages the Sidebar UI.
 * Relies on 'style.css' for visual styling by toggling classes.
 */
export class SidebarController {
    constructor(options = {}) {
        this.onPlaceAgent = options.onPlaceAgent || (() => {});
        this.cameraDrawer = options.cameraDrawer;

        this.container = document.querySelector('#tab-agents');

        this.setupEvents();
        this.loadAgents();
    }

    setupEvents() {
        this.setupTabs();
        this.setupAnalysis();

        document.addEventListener('agentPlaced', () => this.loadAgents());
        window.deleteAgent = (id) => this.deleteAgent(id);
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabSections = document.querySelectorAll('.tab-section');
        const btnAgentPlaatsen = document.getElementById("btnAgentPlaatsen");

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabSections.forEach(section => section.style.display = 'none');
                const targetId = button.getAttribute('data-tab');
                const targetSection = document.getElementById(targetId);
                if (targetSection) targetSection.style.display = 'block';

                if (btnAgentPlaatsen) {
                    btnAgentPlaatsen.style.display = (targetId === 'tab-gegevens') ? 'none' : 'block';
                }
            });
        });

        if (btnAgentPlaatsen) {
            btnAgentPlaatsen.onclick = () => this.onPlaceAgent();
        }
    }

    setupAnalysis() {
        window.startAnalysis = (btn) => this.runAnalysis(btn);
    }

    async loadAgents() {
        try {
            const agents = await CameraService.getAll();
            this.renderAgentList(agents);
        } catch (error) {
            console.error("[SidebarController] Error loading agents:", error);
        }
    }


    renderAgentList(agents) {
        this.container.innerHTML = '<h2>Agents</h2>';

        if (!agents || agents.length === 0) {
            this.container.innerHTML += '<p style="color:#ccc; padding:10px;">Nog geen agents geplaatst.</p>';
            return;
        }

        agents.forEach((agent, index) => {
            // 1. Card Container
            const card = document.createElement('div');
            card.className = 'agent-card';
            card.dataset.agentId = agent.id;

            // --- ROW 1: HEADER (Title + Small Tools) ---
            const headerRow = document.createElement('div');
            headerRow.className = 'agent-header-row';

            // A. Title
            const titleSpan = document.createElement('span');
            titleSpan.innerText = `Agent #${index + 1}`;

            // B. Tools Container
            const toolsDiv = document.createElement('div');
            toolsDiv.style.display = "flex";
            toolsDiv.style.gap = "5px";

            // Expand Button
            const expandBtn = document.createElement('button');
            expandBtn.type = "button";
            expandBtn.className = "icon-btn";
            expandBtn.title = "Details tonen";
            expandBtn.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`;

            expandBtn.onclick = () => {
                const details = card.querySelector('.analysis-details');
                if (details) {
                    const isHidden = getComputedStyle(details).display === 'none';
                    details.style.display = isHidden ? 'block' : 'none';
                    expandBtn.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            };

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.type = "button";
            deleteBtn.className = "icon-btn delete-btn";
            deleteBtn.title = "Agent verwijderen";
            deleteBtn.onclick = () => deleteAgent(agent.id);
            deleteBtn.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>`;

            toolsDiv.appendChild(expandBtn);
            toolsDiv.appendChild(deleteBtn);
            headerRow.appendChild(titleSpan);
            headerRow.appendChild(toolsDiv);

            // --- ROW 2: BODY (Status + Big Action Button) ---
            const bodyRow = document.createElement('div');
            bodyRow.className = 'agent-body-row';

            // A. Status Text (AANGEPAST: Standaard tekst is nu neutraal)
            const textSpan = document.createElement('span');
            textSpan.className = "status-text";
            textSpan.innerText = "Nog niet geanalyseerd";

            // B. Big Action Button
            const actionBtn = document.createElement('button');
            actionBtn.type = "button";
            actionBtn.className = "action-btn big-btn";
            actionBtn.onclick = () => this.runAnalysis(actionBtn);

            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = `<svg style="width:24px; height:24px; fill:white;" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>`;

            actionBtn.appendChild(iconSpan);
            bodyRow.appendChild(textSpan);
            bodyRow.appendChild(actionBtn);

            // Assemble Card
            card.appendChild(headerRow);
            card.appendChild(bodyRow);
            this.container.appendChild(card);

            // 4. Check DB for existing analysis
            if (this.checkExistingAnalysis) {
                this.checkExistingAnalysis(agent.id, card, actionBtn, textSpan, iconSpan);
            }
        });
    }

    async runAnalysis(btnElement) {
        const card = btnElement.closest('.agent-card');
        const agentId = card.dataset.agentId;
        const bodyRow = btnElement.closest('.agent-body-row');
        const textSpan = bodyRow.querySelector('.status-text');

        let iconSvg = btnElement.querySelector('svg');
        if (!iconSvg && btnElement.querySelector('span')) {
            iconSvg = btnElement.querySelector('span').querySelector('svg');
        }

        const controller = new AbortController();
        const signal = controller.signal;

        // UI: Set Processing State (Nederlandse tekst)
        textSpan.innerText = "Vliegen & Scannen...";
        btnElement.classList.add('processing');

        if (iconSvg) {
            iconSvg.classList.add('spinning');
            iconSvg.innerHTML = '<path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/>';
        }

        btnElement.onclick = (e) => {
            e.stopPropagation();
            controller.abort();
        };

        try {
            if (!this.cameraDrawer) throw new Error("Geen verbinding met CameraDrawer");

            // Stap 1: Vliegen
            await this.cameraDrawer.flyToCamera(agentId);
            await new Promise(r => setTimeout(r, 500));

            // Stap 2: Screenshot
            const base64Image = this.cameraDrawer.getScreenshotData();
            textSpan.innerText = "Analyseren...";

            // Stap 3: Backend
            const response = await fetch(`http://localhost:8081/api/analyze-pov`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agentId: agentId,
                    imageBase64: base64Image
                }),
                signal
            });

            if (!response.ok) throw new Error(`Server fout: ${response.status}`);

            const data = await response.json();

            // Stap 4: Resultaat tonen
            this._renderAnalysisResults(card, btnElement, textSpan, iconSvg, data);

        } catch (error) {
            // Cleanup bij fout
            if (iconSvg) iconSvg.classList.remove('spinning');
            btnElement.classList.remove('processing');

            if (error.name === 'AbortError') {
                console.log("Analyse geannuleerd.");
                textSpan.innerText = "Nog niet geanalyseerd";
                // Restore search icon
                if (iconSvg) iconSvg.innerHTML = '<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />';
            } else {
                console.error("Fout:", error);
                textSpan.innerText = "Fout bij analyse";
                // Warning icon
                if (iconSvg) iconSvg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>';
            }
            // Herstel klik functie
            btnElement.onclick = () => window.startAnalysis(btnElement);
        }
    }

    async deleteAgent(id) {
        if (!confirm("Are you sure you want to delete this agent?")) return;
        try {
            await CameraService.delete(id);
            location.reload();
        } catch (e) {
            console.error("Delete failed", e);
        }
    }

    async runAnalysis(btnElement) {
        const card = btnElement.closest('.agent-card');
        const agentId = card.dataset.agentId;

        // Find sibling text in the body row
        const bodyRow = btnElement.closest('.agent-body-row');
        const textSpan = bodyRow.querySelector('.status-text');

        // Find icon inside button
        let iconSvg = btnElement.querySelector('svg');
        if (!iconSvg && btnElement.querySelector('span')) {
            iconSvg = btnElement.querySelector('span').querySelector('svg');
        }

        const controller = new AbortController();
        const signal = controller.signal;

        // UI: Set Processing State (CSS handles colors via .processing)
        textSpan.innerText = "Flying & Scanning...";
        btnElement.classList.add('processing');

        // Add spinner icon
        if (iconSvg) {
            iconSvg.classList.add('spinning');
            // Swap to hourglass icon
            iconSvg.innerHTML = '<path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/>';
        }

        btnElement.onclick = (e) => {
            e.stopPropagation();
            controller.abort();
        };

        try {
            if (!this.cameraDrawer) throw new Error("No connection to CameraDrawer");

            // Step 1: Fly
            await this.cameraDrawer.flyToCamera(agentId);
            await new Promise(r => setTimeout(r, 500));

            // Step 2: Screenshot
            const base64Image = this.cameraDrawer.getScreenshotData();
            textSpan.innerText = "Analyzing...";

            // Step 3: Backend
            const response = await fetch(`http://localhost:8081/api/analyze-pov`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agentId: agentId,
                    imageBase64: base64Image
                }),
                signal
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();

            // Step 4: Render
            this._renderAnalysisResults(card, btnElement, textSpan, iconSvg, data, agentId);

        } catch (error) {
            // Cleanup UI on error
            if (iconSvg) iconSvg.classList.remove('spinning');
            btnElement.classList.remove('processing');

            if (error.name === 'AbortError') {
                console.log("Analysis cancelled.");
                textSpan.innerText = "Score: 0/100";
                // Restore search icon
                if (iconSvg) iconSvg.innerHTML = '<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />';
            } else {
                console.error("Error:", error);
                textSpan.innerText = "Error";
                // Warning icon
                if (iconSvg) iconSvg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>';
            }
            // Restore click
            btnElement.onclick = () => window.startAnalysis(btnElement);
        }
    }

    async checkExistingAnalysis(agentId, card, btnElement, textSpan, iconSvg) {
        try {
            const response = await fetch(`http://localhost:8081/api/analysis?agentId=${agentId}`);
            if (response.ok) {
                const dbRecord = await response.json();
                let analysisData;
                if (typeof dbRecord.response === 'string') {
                    analysisData = JSON.parse(dbRecord.response);
                } else {
                    analysisData = dbRecord.response;
                }
                this._renderAnalysisResults(card, btnElement, textSpan, iconSvg, analysisData, agentId);
            }
        } catch (error) {
            // No saved analysis found
        }
    }

    _renderAnalysisResults(card, btnElement, textSpan, iconSvg, data, agentId) {
        // 1. Update Button State (CSS class handles disabled look)
        btnElement.classList.remove('processing');
        btnElement.classList.add('finished');
        btnElement.disabled = true;

        // 2. Update Text & Icon
        textSpan.innerText = `Score: ${data.quality_of_life_score}/100`;
        // Checkmark Icon
        if (iconSvg) {
            iconSvg.classList.remove('spinning');
            iconSvg.innerHTML = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>';
        }

        // 3. Score Color Logic
        // Kept in JS because it depends on specific number ranges
        const score = data.quality_of_life_score;
        if (score >= 70) btnElement.style.backgroundColor = "#4caf50"; // Green
        else if (score >= 50) btnElement.style.backgroundColor = "#ff9800"; // Orange
        else btnElement.style.backgroundColor = "#f44336"; // Red

        // 4. Update Details Section
        let detailsDiv = card.querySelector('.analysis-details');
        if (!detailsDiv) {
            detailsDiv = document.createElement('div');
            detailsDiv.className = 'analysis-details';
            card.appendChild(detailsDiv);
        }

        const imageUrl = `http://localhost:8081/api/camera/${agentId}/image?t=${new Date().getTime()}`;
        detailsDiv.innerHTML =
            `<strong>Analysis:</strong>${data.justification}
            <div class="analysis-image"">
                <img src="${imageUrl}" alt="POV Analyse" style="width: 100%; display: block; height: auto;">
            </div>`;
    }
}