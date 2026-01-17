import { CameraService } from "../../services/CameraService.js";

export class CameraDrawer {
    constructor(viewer) {
        this.viewer = viewer;
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        this.placementActive = false;
        
        // We maintain local data here to know where to fly to later
        this.cameraDataList = [];
    }

    /**
     * Enables the mode to place a new camera on the map.
     */
    startPlacement() {
        if (this.placementActive) return;
        this.placementActive = true;
        console.log("[CameraDrawer] Placement mode enabled");

        // Remove any existing click handlers to avoid conflicts
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Listen for the click event
        this.handler.setInputAction(async (click) => {
            if (!this.placementActive) return;

            const pickPosition = this.viewer.scene.pickPosition(click.position);
            if (!Cesium.defined(pickPosition)) {
                console.warn("[CameraDrawer] No pick position found.");
                return;
            }

            const cartographic = Cesium.Cartographic.fromCartesian(pickPosition);

            // Set height slightly above ground
            const height = Math.max(cartographic.height || 2, 2) + 0.5;

            // --- DETERMINE ROTATION ---
            // Get the current heading of the user's view (camera).
            let headingDegrees = Cesium.Math.toDegrees(this.viewer.camera.heading);
            
            // FIX: Cesium Man faces East (+X) by default. 
            // We add 90 degrees so he faces 'North' (or aligns with the user's view).
            headingDegrees = (headingDegrees - 90) % 360; 
            // --------------------------

            const cameraPosition = Cesium.Cartesian3.fromDegrees(
                Cesium.Math.toDegrees(cartographic.longitude),
                Cesium.Math.toDegrees(cartographic.latitude),
                height
            );

            // Calculate orientation for the 3D model
            const headingRadians = Cesium.Math.toRadians(headingDegrees);
            const cameraOrientation = Cesium.Transforms.headingPitchRollQuaternion(
                cameraPosition,
                new Cesium.HeadingPitchRoll(headingRadians, 0, 0)
            );

            // Generate a temporary ID (Backend will confirm/generate real ID later)
            const cameraId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

            // Add visual model (The agent/Cesium Man)
            this.viewer.entities.add({
                id: cameraId,
                position: cameraPosition,
                orientation: cameraOrientation,
                properties: new Cesium.PropertyBag({
                    rotation: headingDegrees
                }),
                model: {
                    uri: "Cesium_Man.glb", 
                    scale: 0.3,
                    minimumPixelSize: 40,
                    maximumScale: 2.0,
                    runAnimations: false,                
                    shadows: Cesium.ShadowMode.DISABLED
                }
            });

            // Prepare data object for backend
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);

            const cameraData = {
                id: cameraId,
                position: [lon, lat, height], 
                rotation: headingDegrees, // Store the corrected rotation
                height: height,
                imagePath: "placeholder.jpg"
            };

            // Store locally
            this.cameraDataList.push(cameraData);

            // 1. Save to Backend
            await CameraService.create(cameraData);
            
            // 2. Dispatch event so the Sidebar refreshes instantly
            document.dispatchEvent(new Event('agentPlaced'));
            
            // Exit placement mode
            this.placementActive = false;
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    /**
     * Flies to the specific camera and aligns the view with its rotation (POV).
     * @param {string} cameraId - The ID of the camera/agent.
     * @returns {Promise<boolean>} - Resolves 'true' when the flight is complete.
     */
    flyToCamera(cameraId) {
        return new Promise((resolve) => {
            // Find the camera in our local list
            const cameraData = this.cameraDataList.find(c => c.id === cameraId);
            
            if (!cameraData) { 
                console.warn("[CameraDrawer] Camera not found in list:", cameraId);
                // Fallback: try to find entity in viewer directly
                const entity = this.viewer.entities.getById(cameraId);
                if(!entity) {
                    resolve(false); 
                    return;
                }
                resolve(false);
                return;
            }

            const [lon, lat, height] = cameraData.position;
            const destination = Cesium.Cartesian3.fromDegrees(lon, lat, height);
            
           
            const headingRadians = Cesium.Math.toRadians((cameraData.rotation + 90) % 360);

            // Start animation
            this.viewer.camera.flyTo({
                destination: destination,
                orientation: {
                    heading: headingRadians,
                    pitch: Cesium.Math.toRadians(0), // Look straight ahead (horizon)
                    roll: 0
                },
                duration: 2.0, // Flight duration in seconds
                complete: () => {
                    // This callback fires only when the camera has stopped moving
                    console.log("[CameraDrawer] Arrived at agent POV.");
                    resolve(true); 
                }
            });
        });
    }

    /**
     * Captures a screenshot of the current view.
     * @returns {string} - Base64 encoded PNG string.
     */
    getScreenshotData() {
        // Force a render frame. This prevents getting a black image
        // if the viewer was in an idle state.
        this.viewer.render(); 
        
        // Extract data directly from the canvas
        return this.viewer.canvas.toDataURL('image/png');
    }
}