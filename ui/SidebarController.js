export class SidebarController {
    constructor(options = {}) {
        // De callback die we aanroepen als er een tool (zoals camera) geactiveerd moet worden
        this.onPlaceAgent = options.onPlaceAgent || (() => {});
        
        this.setupEvents();
    }

    setupEvents() {
        this.setupTabs();
        this.setupAnalysis();
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
                
                if (targetSection) {
                    targetSection.style.display = 'block';
                }

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
        // Maak de functie globaal beschikbaar voor de inline onclick in de HTML
        window.startAnalysis = (btn) => this.runAnalysis(btn);
    }

    async runAnalysis(btnElement) {
        const card = btnElement.closest('.agent-card');
        const polygonId = card.dataset.polygonId;

        const actionDiv = btnElement.closest('.agent-action');
        const textSpan = actionDiv.querySelector('span');
        const iconSvg = btnElement.querySelector('svg');

        textSpan.innerText = "Bezig met analyse...";
        iconSvg.classList.add('spinning');
        btnElement.disabled = true;

        try {
            if (!polygonId) {
                throw new Error("No polygonId found on agent card");
            }

            const response = await fetch(
                `http://localhost:3000/api/run-ai?polygonId=${polygonId}`
            );

            const data = await response.json();

            this._renderAnalysisResults(card, btnElement, textSpan, iconSvg, data);

        } catch (error) {
            console.error("AI Analyse Fout:", error);
            textSpan.innerText = "Fout bij analyse";
            iconSvg.classList.remove('spinning');
            btnElement.disabled = false;
        }
    }


    _renderAnalysisResults(card, btn, span, svg, data) {
        svg.classList.remove('spinning');
        btn.disabled = false;
        span.innerText = "Bekijk analyse";
        svg.innerHTML = '<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>';

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

        btn.onclick = (e) => {
            e.stopPropagation();
            detailsDiv.classList.toggle('open');
            btn.style.transform = detailsDiv.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        };

        detailsDiv.classList.add('open');
        btn.style.transform = 'rotate(180deg)';
    }
}