import { StructureService } from "../../services/StructureService.js";
import { CameraService } from "../../services/CameraService.js";

// RotationTool - Handles rotating selected entities (structures and cameras) in the Cesium viewer
export class RotationTool {
    constructor(viewer, selection) {
        this.viewer = viewer;
        this.selection = selection;

        this.active = false;
        this.dragging = false;

        this.startAngle = null;
        this.startRotation = null;

        this.ringEntity = null;
        this.ringRadius = 15;

        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        // Initialize without setting actions - will be set when activated
    }

    // Setup mouse event handlers when tool is activated
    setupHandlers() {
        // Drag start - begin rotation operation
        this.handler.setInputAction((movement) => {
            if (!this.active) return;

            const entity = this.selection.getSelected();
            if (!entity) return;

            const angle = this.getAngleToMouse(movement);
            if (angle === null) return;

            this.dragging = true;
            this.startAngle = angle;
            this.startRotation = entity.properties?.rotation?.getValue ?
                entity.properties.rotation.getValue() :
                (entity.properties?.rotation ?? 0);

            console.log("[RotationTool] drag start");
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        // Drag move - update rotation as mouse moves
        this.handler.setInputAction((movement) => {
            if (!this.active || !this.dragging) return;

            const entity = this.selection.getSelected();
            if (!entity) return;

            const currentAngle = this.getAngleToMouse(movement);
            if (currentAngle === null) return;

            const deltaAngle = currentAngle - this.startAngle;
            const deltaDegrees = Cesium.Math.toDegrees(deltaAngle);
            const newRotation = this.startRotation - deltaDegrees;  // Invert the rotation direction

            this.applyRotation(entity, newRotation);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // Drag end - complete rotation and save to backend
        this.handler.setInputAction(async () => {
            if (!this.active || !this.dragging) return;

            this.dragging = false;

            const entity = this.selection.getSelected();
            if (entity) {
                await this.persistRotation(entity);
            }

            console.log("[RotationTool] drag end → rotation persisted");
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    // Remove mouse event handlers when tool is deactivated
    removeHandlers() {
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    // Activate the rotation tool
    activate() {
        this.active = true;
        this.setupHandlers(); // Enable handlers when tool is activated

        const entity = this.selection.getSelected();
        if (entity) {
            this.showRotationRing(entity);
        }

        const c = this.viewer.scene.screenSpaceCameraController;
        c.enableRotate = false;
        c.enableTranslate = false;
        c.enableZoom = false;
        c.enableTilt = false;
        c.enableLook = false;

        console.log("[RotationTool] activated");
    }

    // Deactivate the rotation tool
    deactivate() {
        this.active = false;
        this.dragging = false;
        this.removeHandlers(); // Disable handlers when tool is deactivated

        this.hideRotationRing();

        const c = this.viewer.scene.screenSpaceCameraController;
        c.enableRotate = true;
        c.enableTranslate = true;
        c.enableZoom = true;
        c.enableTilt = true;
        c.enableLook = true;

        console.log("[RotationTool] deactivated");
    }

    // Calculate angle from entity center to mouse position
    getAngleToMouse(movement) {
        const screenPos = movement.endPosition ?? movement.position;

        if (!screenPos) return null;

        const ray = this.viewer.camera.getPickRay(screenPos);
        if (!ray) return null;

        const entity = this.selection.getSelected();
        if (!entity) return null;

        const center = entity.position.getValue(this.viewer.clock.currentTime);
        const centerCartographic = Cesium.Cartographic.fromCartesian(center);
        if (!centerCartographic) return null;

        // Pick the position on the globe at the mouse position
        const hitPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        if (!hitPosition) return null;

        // Convert to cartographic to work with geographic coordinates
        const hitCartographic = Cesium.Cartographic.fromCartesian(hitPosition);
        if (!hitCartographic) return null;

        // Calculate the angle in the local tangent plane at the entity's position
        // Create east and north vectors at the entity's location
        const east = new Cesium.Cartesian3();
        const north = new Cesium.Cartesian3();

        // Calculate local east-north-up frame at the center position
        const normal = Cesium.Cartesian3.fromRadians(centerCartographic.longitude, centerCartographic.latitude, 0.0);
        Cesium.Cartesian3.normalize(normal, normal);

        // Calculate the geodetic surface normal (up vector)
        const up = Cesium.Cartesian3.clone(normal);

        // East vector: perpendicular to both geodetic normal and true Z axis
        // This gives us the eastward direction
        Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_Z, up, east);
        if (Cesium.Cartesian3.magnitudeSquared(east) < Cesium.Math.EPSILON10) {
            // Special case when at poles: use X axis as reference
            Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_X, up, east);
        }
        Cesium.Cartesian3.normalize(east, east);

        // North vector: perpendicular to east and up
        Cesium.Cartesian3.cross(up, east, north);
        Cesium.Cartesian3.normalize(north, north);

        // Calculate vector from center to hit point in local coordinates
        const vector = new Cesium.Cartesian3();
        Cesium.Cartesian3.subtract(hitPosition, center, vector);

        // Project vector onto the east-north plane
        const eastComponent = Cesium.Cartesian3.dot(vector, east);
        const northComponent = Cesium.Cartesian3.dot(vector, north);

        // Calculate angle relative to east direction
        return Math.atan2(northComponent, eastComponent);
    }

    // Apply rotation to entity (visual only)
    applyRotation(entity, rotation) {
        const normalized = ((rotation % 360) + 360) % 360;

        // Ensure properties object exists and set rotation
        if (!entity.properties) {
            entity.properties = new Cesium.PropertyBag();
        }
        entity.properties.rotation = normalized;

        // Update the entity's orientation based on its current position
        const currentPosition = entity.position.getValue(Cesium.JulianDate.now());
        entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
            currentPosition,
            new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(normalized),
                0,
                0
            )
        );

    }

    // Show rotation ring indicator
    showRotationRing(entity) {
        this.hideRotationRing();

        this.ringEntity = this.viewer.entities.add({
            position: entity.position, // Use the entity's position property directly
            ellipse: {
                semiMajorAxis: this.ringRadius,
                semiMinorAxis: this.ringRadius,
                height: 0.1,
                outline: true,
                outlineColor: Cesium.Color.YELLOW,
                outlineWidth: 3,
                fill: false
            }
        });

        console.log("[RotationTool] rotation ring shown");
    }

    // Hide rotation ring indicator
    hideRotationRing() {
        if (this.ringEntity) {
            this.viewer.entities.remove(this.ringEntity);
            this.ringEntity = null;
            console.log("[RotationTool] rotation ring hidden");
        }
    }

    // Persist rotation to backend service (for structures and cameras)
    async persistRotation(entity) {
        try {
            if (entity.properties && entity.properties.rotation !== undefined) {
                const rotation = entity.properties.rotation.getValue ?
                    entity.properties.rotation.getValue() :
                    entity.properties.rotation;

                // Check if it's a camera or structure and update accordingly
                if (entity.model) {
                    // It's a camera entity (using Cesium Man model) - for cameras, we might need to update the orientation
                    // Extract current position and orientation info
                    const currentPosition = entity.position.getValue(Cesium.JulianDate.now());
                    const cartographic = Cesium.Cartographic.fromCartesian(currentPosition);
                    const lon = Cesium.Math.toDegrees(cartographic.longitude);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    const height = cartographic.height;

                    // Update camera with new rotation (heading) while preserving other orientation data
                    await CameraService.update(entity.id, {
                        position: [lon, lat, height], // Include position to ensure it's preserved
                        rotation: rotation // Use rotation as heading for camera
                    });
                    console.log("[RotationTool] Camera rotation saved");

                    // Update the stored camera data in CameraDrawer to reflect the new orientation
                    if (this.viewer.cameraDrawer && typeof this.viewer.cameraDrawer.updateStoredCameraData === 'function') {
                        this.viewer.cameraDrawer.updateStoredCameraData(entity.id);
                    }
                } else if (entity.box) {
                    // It's a structure entity
                    await StructureService.update(entity.id, {
                        rotation: rotation
                    });
                    console.log("[RotationTool] Structure rotation saved");
                }
            }
        } catch (err) {
            console.error("Failed to persist rotation:", err);
            // Log more details about the error for debugging
            console.error("Entity ID:", entity.id);
            console.error("Rotation value:", entity.properties?.rotation);
        }
    }
}
