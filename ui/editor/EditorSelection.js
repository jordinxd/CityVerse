export class EditorSelection {
    constructor(viewer, cameraDrawer = null) {
        this.viewer = viewer;
        this.cameraDrawer = cameraDrawer; // Reference to CameraDrawer for synchronization
        this.selected = null;
        this.callbacks = [];

        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        // this.handler.setInputAction((movement) => {
        //     const picked = viewer.scene.pick(movement.position);

        //     let newSelection = null;

        //     if (picked && picked.id && picked.id.properties) {
        //         newSelection = picked.id;
        //     }

        //     if (newSelection !== this.selected) {
        //         this.selected = newSelection;
        //         this.emitChange();
        //     }

        // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction((movement) => {
    const picked = viewer.scene.pick(movement.position);

    console.log("[Selection] Picked:", picked);

    let newSelection = null;

    if (picked && picked.id) {
        // Determine the ID based on whether picked.id is an object or string
        const entityId = typeof picked.id === 'string' ? picked.id : picked.id.id;

        console.log("[Selection] Picked entity ID:", entityId);

        // Check if the picked entity is a camera (has model) or structure (has box)
        if (entityId && typeof entityId === 'string') {
            // Get the actual entity
            const entity = viewer.entities.getById(entityId);
            if (entity) {
                // Check if it's a camera entity (has model - Cesium Man)
                if (entity.model) {
                    newSelection = entity;
                }
                // Or check if it's a structure entity (has box geometry)
                else if (entity.box) {
                    newSelection = entity;
                }
            }
        }
    }

    if (newSelection !== this.selected) {
        console.log("[Selection] Selection changed:", newSelection?.id);
        this.selected = newSelection;

        // Synchronize with CameraDrawer if available, but only for camera entities
        if (this.cameraDrawer) {
            if (newSelection && newSelection.model) {
                // It's a camera entity (has model), update the CameraDrawer's selectedCameraId
                this.cameraDrawer.selectedCameraId = newSelection.id;
            } else {
                // For non-camera entities (like structures), clear the CameraDrawer's selection
                if (this.cameraDrawer.selectedCameraId) {
                    this.cameraDrawer.deselectCamera();
                }
            }
        }

        this.emitChange();
    }

}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    onChange(callback) {
        this.callbacks.push(callback);
    }

    emitChange() {
        this.callbacks.forEach(cb => cb(this.selected));
    }

    getSelected() {
        return this.selected;
    }

    clear() {
        this.selected = null;
        this.emitChange();
    }
}
