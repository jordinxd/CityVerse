/**
 * EditorSelection: Manages entity selection with tool-aware click handling
 * 
 * Click Priority:
 * 1. If a tool (e.g., MoveTool) consumed the click on a gizmo, skip selection
 * 2. If clicking a building entity, select it
 * 3. If clicking empty space, clear selection
 */
export class EditorSelection {
    constructor(viewer, moveTool) {
        this.viewer = viewer;
        this.moveTool = moveTool;
        this.selected = null;
        this.callbacks = [];

        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        this.handler.setInputAction((movement) => {
            this.onLeftClick(movement);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    /**
     * Handle left click with proper tool priority
     */
    onLeftClick(movement) {
        // Priority 1: Check if a tool (e.g., MoveTool) handles this click
        if (this.moveTool && this.moveTool.handlesClick(movement.position)) {
            console.log("[Selection] Tool consumed click on gizmo");
            return; // Don't change selection
        }

        // Priority 2: Try to pick an entity from the scene
        const picked = this.viewer.scene.pick(movement.position);

        let newSelection = null;

        if (picked && picked.id) {
            // Check if it's a valid selectable entity (has properties)
            if (picked.id.properties) {
                newSelection = picked.id;
                console.log("[Selection] Picked entity:", picked.id.id);
            } else {
                console.log("[Selection] Picked non-selectable entity (gizmo?)");
            }
        } else {
            console.log("[Selection] Clicked empty space");
        }

        // Update selection if it changed
        if (newSelection !== this.selected) {
            this.selected = newSelection;
            console.log(
                "[Selection] Selection changed to:",
                newSelection ? newSelection.id : "null"
            );
            this.emitChange();
        }
    }

    /**
     * Register a callback to be called when selection changes
     */
    onChange(callback) {
        this.callbacks.push(callback);
    }

    /**
     * Emit change event to all listeners
     */
    emitChange() {
        this.callbacks.forEach((cb) => cb(this.selected));
    }

    /**
     * Get currently selected entity
     */
    getSelected() {
        return this.selected;
    }

    /**
     * Clear selection
     */
    clear() {
        this.selected = null;
        this.emitChange();
    }
}
