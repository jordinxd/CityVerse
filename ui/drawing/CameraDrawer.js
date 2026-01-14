import { CameraService } from "../../services/CameraService.js";

// CameraDrawer - Handles placing, rendering, and managing cameras in the Cesium viewer
export class CameraDrawer {
    constructor(viewer, editorSelection = null) {
        this.viewer = viewer;
        this.editorSelection = editorSelection; // Reference to shared selection system
        this.placementActive = false;
        this.cameraDataList = []; // Stores cameras with their viewer view
        this.selectedCameraId = null;


        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    }

    isCameraEntityById(cameraId) {
        const entityInViewer = this.viewer.entities.getById(cameraId);
        if (entityInViewer && entityInViewer.model) {
            // Check if the entity has a model property (indicating it's a camera with Cesium Man)
            return true;
        }
        return false;
    }

    // Method to handle selection from EditorSelection
    handleSelection(entityId) {
        if (this.isCameraEntityById(entityId)) {
            this.selectCamera(entityId);
            return true; // Indicate that this is a camera and was handled
        }
        return false; // Not a camera entity
    }

    selectCamera(cameraId) {
        // Deselect previous
        if (this.selectedCameraId) this.deselectCamera();

        this.selectedCameraId = cameraId;
        const entity = this.viewer.entities.getById(cameraId);

        if (entity) {
            // Highlight the selected camera model
            if (entity.model) {
                // We can add a label or change the model appearance when selected
                entity.label = {
                    text: 'Agent',
                    font: '14pt sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -9),
                    scale: 0.7
                };
            }
        }

        // Notify editor selection about the camera selection
        if (this.editorSelection) {
            this.editorSelection.selected = entity;
            this.editorSelection.emitChange();
        }

        console.log("[CameraDrawer] Selected camera:", cameraId);
    }

    deselectCamera() {
        if (this.selectedCameraId) {
            const entity = this.viewer.entities.getById(this.selectedCameraId);
            if (entity && entity.model) {
                // Remove label when deselecting camera
                delete entity.label;
            }
            this.selectedCameraId = null;
        }

        // Also clear the editor selection
        if (this.editorSelection) this.editorSelection.clear();
    }

    startPlacement() {
        if (this.placementActive) return;
        this.placementActive = true;
        console.log("[CameraDrawer] Placement mode enabled");

        // Remove any existing click handler to avoid conflicts during placement
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction(async (click) => {
            if (!this.placementActive) return;

            const pickPosition = this.viewer.scene.pickPosition(click.position);
            if (!Cesium.defined(pickPosition)) {
                console.warn("[CameraDrawer] No pick position found.");
                return;
            }

            const cartographic = Cesium.Cartographic.fromCartesian(pickPosition);

            const height = Math.max(cartographic.height || 2, 2) + 0.5;
            const headingDegrees = 0;

            const cameraPosition = Cesium.Cartesian3.fromDegrees(
                Cesium.Math.toDegrees(cartographic.longitude),
                Cesium.Math.toDegrees(cartographic.latitude),
                height
            );

            // Create quaternion for camera orientation based on heading
            const cameraOrientation = Cesium.Transforms.headingPitchRollQuaternion(
                cameraPosition,
                new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(headingDegrees), 0, 0) // Just heading, no pitch/roll
            );

            // Add Cesium Man model for camera (shows orientation visually)
            const cameraId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
            this.viewer.entities.add({
                id: cameraId,
                position: cameraPosition,
                orientation: cameraOrientation,
                properties: new Cesium.PropertyBag({
                    rotation: headingDegrees
                }),
                model: {
                    uri: "Cesium_Man.glb",  // Using the Cesium Man model from the project root
                    scale: 0.3,  // Reduced scale for better visibility
                    minimumPixelSize: 40,    // Minimum size in pixels
                    maximumScale: 2.0        // Maximum scale factor to prevent excessive growth
                }
            });

            // Store camera data in a simplified format similar to structures
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);

            const cameraData = {
                id: cameraId,
                type: "camera", // Similar to structures
                position: [lon, lat, height], // [longitude, latitude, height] like structures
                rotation: headingDegrees, // Like structures
                height: height // Like structures
            };

            this.cameraDataList.push(cameraData);
            console.log("[CameraDrawer] Camera stored:", cameraData);

            await CameraService.create(cameraData);
            this.placementActive = false;

            // Re-enable camera selection after placement is done
            // The EditorSelection will handle selection now
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    async removeEntityFromViewer(cameraId) {
        const entity = this.viewer.entities.getById(cameraId);
        if (entity) this.viewer.entities.remove(entity);

        console.log("[CameraDrawer] Removed camera entity:", cameraId);

        await CameraService.delete(cameraId);
    }

    // Update stored camera data when camera is moved or rotated - simplified version
    updateStoredCameraData(cameraId) {
        const entity = this.viewer.entities.getById(cameraId);
        if (!entity || !entity.position) {
            console.warn("[CameraDrawer] Could not update stored data for camera:", cameraId);
            return false;
        }

        // Get current position from the visual entity
        const currentPosition = entity.position.getValue(Cesium.JulianDate.now());
        const cartographic = Cesium.Cartographic.fromCartesian(currentPosition);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const height = cartographic.height;

        // Get rotation from entity properties if available
        let rotation = 0;
        if (entity.properties && entity.properties.rotation) {
            rotation = entity.properties.rotation.getValue ?
                entity.properties.rotation.getValue() :
                entity.properties.rotation;
        }

        // Find and update the camera data in the list
        const index = this.cameraDataList.findIndex(c => c.id === cameraId);
        if (index >= 0) {
            // Update the existing camera data in structure similar to backend
            this.cameraDataList[index].position = [lon, lat, height];
            this.cameraDataList[index].rotation = rotation;
            this.cameraDataList[index].height = height;

            console.log("[CameraDrawer] Updated stored camera data for:", cameraId);
            return true;
        } else {
            console.warn("[CameraDrawer] Camera not found in stored data:", cameraId);
            return false;
        }
    }

    // Fly-to camera using stored viewer state
    flyToCamera(cameraId = null) {
        if (!cameraId) cameraId = this.selectedCameraId;

        if (!cameraId) {
            console.warn("[CameraDrawer] No camera selected to fly to.");
            return;
        }

        const cameraData = this.cameraDataList.find(c => c.id === cameraId);
        if (!cameraData) {
            console.warn("[CameraDrawer] Camera data not found:", cameraId);
            return;
        }

        const [lon, lat, height] = cameraData.position;

        const destination = Cesium.Cartesian3.fromDegrees(
            lon,
            lat,
            height
        );

    const headingRadians = Cesium.Math.toRadians(cameraData.rotation + 90); // Adjust heading to Cesium's coordinate system
    const pitchRadians = Cesium.Math.toRadians(0); // Slight downward pitch
    const rollRadians = 0; // No roll

    this.viewer.camera.flyTo({
        destination,
        orientation: {
            heading: headingRadians,
            pitch: pitchRadians,
            roll: rollRadians
        },
        duration: 2
    });
        console.log("[CameraDrawer] Flying to camera:", cameraId);
    }

    // Screenshot functionality
    takeScreenshot() {
        try {
            this.viewer.render();
            const screenshotDataUrl = this.viewer.canvas.toDataURL('image/png');

            const link = document.createElement('a');
            link.download = `cesium-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
            link.href = screenshotDataUrl;
            link.click();

            console.log("[CameraDrawer] Screenshot taken and downloaded");
            return screenshotDataUrl;
        } catch (error) {
            console.error("[CameraDrawer] Failed to take screenshot:", error);
            return null;
        }
    }
}
