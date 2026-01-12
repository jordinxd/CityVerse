import { StructureService } from "../../services/StructureService.js";
import { CameraService } from "../../services/CameraService.js";

export class MoveTool {
    constructor(viewer, selection) {
        this.viewer = viewer;
        this.selection = selection;
        this.gizmoEntities = [];
        this.active = false;
        this.moving = false;
        this.originalPosition = null;
        this.movementStart = null;

        // Initialize handler but don't set actions until activated
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    }

    setupHandlers() {
        // Mouse down to start moving (only when we have a selected entity)
        this.handler.setInputAction((movement) => {
            if (!this.active) return;

            const selected = this.selection.getSelected();
            if (!selected) return; // Don't start moving if nothing is selected

            this.moving = true;
            this.originalPosition = selected.position.getValue(Cesium.JulianDate.now());
            this.movementStart = movement.position;

            // Disable camera controls while moving
            const c = this.viewer.scene.screenSpaceCameraController;
            c.enableRotate = false;
            c.enableTranslate = false;
            c.enableZoom = false;
            c.enableTilt = false;
            c.enableLook = false;

            console.log("[MoveTool] Started moving entity");
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        // Mouse move to update position
        this.handler.setInputAction((movement) => {
            if (!this.active || !this.moving) return;

            const selected = this.selection.getSelected();
            if (!selected) return;

            const newPosition = this.calculateNewPosition(selected, movement.endPosition);
            if (newPosition) {
                selected.position = newPosition;
                this.updateGizmoPosition(newPosition); // Update gizmo position while moving
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // Mouse up to finish moving
        this.handler.setInputAction(async () => {
            if (!this.active || !this.moving) return;

            this.moving = false;

            // Re-enable camera controls after moving
            const c = this.viewer.scene.screenSpaceCameraController;
            c.enableRotate = true;
            c.enableTranslate = true;
            c.enableZoom = true;
            c.enableTilt = true;
            c.enableLook = true;

            const selected = this.selection.getSelected();
            if (selected) {
                await this.persistPosition(selected);
            }

            console.log("[MoveTool] Finished moving entity");
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    removeHandlers() {
        // Remove all input actions to prevent interference with selection
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    activate() {
        console.log("Move tool activated");
        this.active = true;
        this.setupHandlers(); // Enable handlers when tool is activated
        this.showGizmo();
    }

    deactivate() {
        this.active = false;
        this.moving = false;
        this.removeHandlers(); // Disable handlers when tool is deactivated
        this.clearGizmo();
    }

    calculateNewPosition(entity, mousePosition) {
        if (!mousePosition) return null;

        const ray = this.viewer.camera.getPickRay(mousePosition);
        if (!ray) return null;

        // Get the current position of the entity to determine the height to maintain
        const currentPosition = entity.position.getValue(Cesium.JulianDate.now());
        const currentCartographic = Cesium.Cartographic.fromCartesian(currentPosition);
        if (!currentCartographic) return null;

        // Pick the position on the globe at the mouse position
        const pickedPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        if (!pickedPosition) return null;

        // Convert the picked position to cartographic to get longitude and latitude
        const pickedCartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
        if (!pickedCartographic) return null;

        // Create a new position with the picked longitude/latitude but maintaining the original height
        return Cesium.Cartesian3.fromRadians(
            pickedCartographic.longitude,
            pickedCartographic.latitude,
            currentCartographic.height
        );
    }

    updateGizmoPosition(newPosition) {
        // Clear current gizmo
        this.clearGizmo();

        // Create new gizmo at the new position
        this.createGizmoAtPosition(newPosition);
    }

    showGizmo() {
        this.clearGizmo();

        const selected = this.selection.getSelected();
        if (!selected) return;

        const pos = selected.position.getValue(Cesium.JulianDate.now());
        this.createGizmoAtPosition(pos);
    }

    createGizmoAtPosition(pos) {
        // RED ARROW (X axis)
        this.gizmoEntities.push(this.viewer.entities.add({
            position: pos, // Position the entity at the object's location
            polyline: {
                positions: [
                    pos,
                    Cesium.Cartesian3.add(pos, new Cesium.Cartesian3(10, 0, 0), new Cesium.Cartesian3())
                ],
                width: 5,
                material: Cesium.Color.RED
            }
        }));

        // GREEN ARROW (Y axis)
        this.gizmoEntities.push(this.viewer.entities.add({
            position: pos, // Position the entity at the object's location
            polyline: {
                positions: [
                    pos,
                    Cesium.Cartesian3.add(pos, new Cesium.Cartesian3(0, 10, 0), new Cesium.Cartesian3())
                ],
                width: 5,
                material: Cesium.Color.GREEN
            }
        }));
    }

    clearGizmo() {
        this.gizmoEntities.forEach(e => this.viewer.entities.remove(e));
        this.gizmoEntities = [];
    }

    async persistPosition(entity) {
        try {
            const newPosition = entity.position.getValue(Cesium.JulianDate.now());

            // Convert Cartesian3 to longitude, latitude, height
            const cartographic = Cesium.Cartographic.fromCartesian(newPosition);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const height = cartographic.height;

            // Check if it's a camera or structure and update accordingly
            if (entity.model) {
                // It's a camera entity (using Cesium Man model)
                // Send position as [longitude, latitude, height] array
                const positionArray = [lon, lat, height];

                // Get the current rotation if it exists
                let currentRotation = 0;
                if (entity.properties && entity.properties.rotation) {
                    const rotation = entity.properties.rotation.getValue ?
                        entity.properties.rotation.getValue() :
                        entity.properties.rotation;
                    currentRotation = rotation;
                }

                await CameraService.update(entity.id, {
                    position: positionArray,
                    height: height,  // Send height separately as the backend expects it
                    rotation: currentRotation  // Preserve the current rotation
                });
                console.log("[MoveTool] Camera position saved");

                // Update the stored camera data in CameraDrawer to reflect the new position
                if (this.viewer.cameraDrawer && typeof this.viewer.cameraDrawer.updateStoredCameraData === 'function') {
                    this.viewer.cameraDrawer.updateStoredCameraData(entity.id);
                }
            } else if (entity.box) {
                // It's a structure entity
                await StructureService.update(entity.id, {
                    position: [lon, lat]
                });
                console.log("[MoveTool] Structure position saved");
            }
        } catch (err) {
            console.error("Failed to persist position:", err);
        }
    }
}
