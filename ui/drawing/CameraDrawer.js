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

        // Click handler for selecting cameras
        this.handler.setInputAction((click) => {
            const pickedObject = this.viewer.scene.pick(click.position);
            if (pickedObject && pickedObject.id) {
                // Determine the ID based on whether pickedObject.id is an object or string
                const entityId = typeof pickedObject.id === 'string' ? pickedObject.id : pickedObject.id.id;

                if (this.isCameraEntityById(entityId)) {
                    this.selectCamera(entityId);
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    isCameraEntityById(cameraId) {
        const entityInViewer = this.viewer.entities.getById(cameraId);
        if (entityInViewer && entityInViewer.model) {
            // Check if the entity has a model property (indicating it's a camera with Cesium Man)
            return true;
        }
        return false;
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
                    text: 'CAMERA',
                    font: '14pt sans-serif',
                    fillColor: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -9),
                    scale: 0.7
                };
            }
        }

        if (this.editorSelection) {
            const cesiumEntity = this.viewer.entities.getById(cameraId);
            if (cesiumEntity) {
                // Only update editor selection if it's actually a camera entity (has model)
                if (cesiumEntity.model) {
                    this.editorSelection.selected = cesiumEntity;
                    this.editorSelection.emitChange();
                }
            }
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

        if (this.editorSelection) this.editorSelection.clear();
    }

    startPlacement() {
        if (this.placementActive) return;
        this.placementActive = true;
        console.log("[CameraDrawer] Placement mode enabled");

        this.handler.setInputAction(async (click) => {
            if (!this.placementActive) return;

            const pickPosition = this.viewer.scene.pickPosition(click.position);
            if (!Cesium.defined(pickPosition)) {
                console.warn("[CameraDrawer] No pick position found.");
                return;
            }

            const cartographic = Cesium.Cartographic.fromCartesian(pickPosition);
            let height = cartographic.height || 2;
            height = Math.max(height, 2) + 2;

            const heightInput = prompt("Camera height (meters):", height.toFixed(1));
            if (heightInput !== null) height = parseFloat(heightInput);

            const headingDegrees = parseFloat(prompt("Heading (degrees, 0-360):", "0"));
            const pitchDegrees = parseFloat(prompt("Pitch (degrees, up/down):", "0"));
            const rollDegrees = 0;

            const heading = Cesium.Math.toRadians(headingDegrees);
            const pitch = Cesium.Math.toRadians(pitchDegrees);
            const roll = Cesium.Math.toRadians(rollDegrees);

            const cameraPosition = Cesium.Cartesian3.fromDegrees(
                Cesium.Math.toDegrees(cartographic.longitude),
                Cesium.Math.toDegrees(cartographic.latitude),
                height
            );

            // Create quaternion for camera orientation
            const cameraOrientation = Cesium.Transforms.headingPitchRollQuaternion(
                cameraPosition,
                new Cesium.HeadingPitchRoll(heading, pitch, roll)
            );

            // Add Cesium Man model for camera (shows orientation visually)
            const cameraId = crypto.randomUUID();
            this.viewer.entities.add({
                id: cameraId,
                position: cameraPosition,
                orientation: cameraOrientation,
                model: {
                    uri: "Cesium_Man.glb",  // Using the Cesium Man model from the project root
                    scale: 0.3,  // Reduced scale for better visibility
                    minimumPixelSize: 40,    // Minimum size in pixels
                    maximumScale: 2.0        // Maximum scale factor to prevent excessive growth
                }
            });

            // Store camera data along with viewer state for fly-to
            const cameraData = {
                id: cameraId,
                position: [cameraPosition.x, cameraPosition.y, cameraPosition.z],
                orientation: cameraOrientation,
                viewerState: {
                    destination: cameraPosition.clone(),
                    orientation: cameraOrientation.clone()
                }
            };

            this.cameraDataList.push(cameraData);
            console.log("[CameraDrawer] Camera stored:", cameraData);

            await CameraService.create(cameraData);
            this.placementActive = false;
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    async removeEntityFromViewer(cameraId) {
        const entity = this.viewer.entities.getById(cameraId);
        if (entity) this.viewer.entities.remove(entity);

        console.log("[CameraDrawer] Removed camera entity:", cameraId);

        await CameraService.delete(cameraId);
    }

    // Update stored camera data when camera is moved or rotated
    updateStoredCameraData(cameraId) {
        const entity = this.viewer.entities.getById(cameraId);
        if (!entity || !entity.position || !entity.orientation) {
            console.warn("[CameraDrawer] Could not update stored data for camera:", cameraId);
            return false;
        }

        // Get current position and orientation from the visual entity
        const currentPosition = entity.position.getValue(Cesium.JulianDate.now());
        const currentOrientation = entity.orientation.getValue(Cesium.JulianDate.now());

        // Find and update the camera data in the list
        const index = this.cameraDataList.findIndex(c => c.id === cameraId);
        if (index >= 0) {
            // Update the existing camera data
            this.cameraDataList[index].position = [currentPosition.x, currentPosition.y, currentPosition.z];
            this.cameraDataList[index].orientation = currentOrientation;
            this.cameraDataList[index].viewerState = {
                destination: currentPosition.clone(),
                orientation: currentOrientation.clone()
            };
            console.log("[CameraDrawer] Updated stored camera data for:", cameraId);
            return true;
        } else {
            console.warn("[CameraDrawer] Camera not found in stored data:", cameraId);
            return false;
        }
    }

    // Fly-to camera using stored viewer state
    async flyToCamera(cameraId = null) {
        // Default to currently selected camera
        if (!cameraId) cameraId = this.selectedCameraId;

        if (!cameraId) {
            console.warn("[CameraDrawer] No camera selected to fly to.");
            return;
        }

        let cameraData = this.cameraDataList.find(c => c.id === cameraId);

        // If camera data not found locally, try to get it from the service
        if (!cameraData) {
            try {
                cameraData = await CameraService.getById(cameraId);
                if (!cameraData) {
                    console.warn("[CameraDrawer] Camera data not found in service:", cameraId);
                    return;
                }

                // Convert service data to the format expected by flyTo
                const cartesianPos = Cesium.Cartesian3.fromArray(cameraData.position);
                const cameraOrientation = cameraData.orientation ?
                    Cesium.Quaternion.unpack(cameraData.orientation) :
                    Cesium.Transforms.headingPitchRollQuaternion(
                        cartesianPos,
                        new Cesium.HeadingPitchRoll(cameraData.heading || 0, cameraData.pitch || 0, cameraData.roll || 0)
                    );

                // Create viewer state for this fly-to operation
                cameraData.viewerState = {
                    destination: cartesianPos.clone(),
                    orientation: cameraOrientation.clone()
                };
            } catch (error) {
                console.error("[CameraDrawer] Error retrieving camera data:", error);
                return;
            }
        }

        if (!cameraData || !cameraData.viewerState) {
            console.warn("[CameraDrawer] Camera data or viewer state not available:", cameraId);
            return;
        }

        // Use stored viewer state - fly to the exact position and orientation of the camera model
        // This will position the viewer at the Cesium Man's location, looking in the same direction (first-person view)
        this.viewer.camera.flyTo({
            destination: cameraData.viewerState.destination,
            orientation: {
                quaternion: cameraData.viewerState.orientation
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
