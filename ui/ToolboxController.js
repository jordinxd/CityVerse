export class ToolboxController {
    constructor() {
        this.callbacks = {};
        this.activeButton = null;
        this.setupEvents();
    }

    on(action, callback) {
        this.callbacks[action] = callback;
    }

    setActiveButton(button, action) {
        // If toggling off the same button
        if (this.activeButton === button) {
            this.activeButton.classList.remove("active");
            this.activeButton = null;

            if (this.callbacks["deactivate"]) {
                this.callbacks["deactivate"](action);
            }
            return false;
        }

        // If switching from another button
        if (this.activeButton) {
            const previousAction = this.activeButton.dataset.action;
            this.activeButton.classList.remove("active");

            if (this.callbacks["deactivate"]) {
                this.callbacks["deactivate"](previousAction);
            }
        }

        // Activate new button
        button.classList.add("active");
        this.activeButton = button;
        this.activeButton.dataset.action = action;
        return true;
    }

    setupEvents() {
        const link = (id, action) => {
            const btn = document.getElementById(id);

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const activated = this.setActiveButton(btn, action);
                if (!activated) return;

                if (this.callbacks[action]) {
                    this.callbacks[action]();
                }
            };
        };

        link("btnDrawArea", "drawArea");
        link("btnFinishArea", "finishArea");
        link("btnCancelArea", "cancelArea");

        link("btnPlaceBuilding", "placeBuilding");
        link("btnPlaceRoad", "placeRoad");
        link("btnPlaceTree", "placeTree");

        link("btnDelete", "delete");
    }
}
