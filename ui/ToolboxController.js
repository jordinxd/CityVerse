export class ToolboxController {
    constructor() {
        this.callbacks = {};
        this.setupEvents();
    }

    // Allow main.js to register handlers
    on(action, callback) {
        this.callbacks[action] = callback;
    }

    setupEvents() {
        const link = (id, action) => {
            document.getElementById(id).onclick = () => {
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

        link("btnDelete", "deleteEntity");
    }
}
