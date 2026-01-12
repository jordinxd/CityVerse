import { CameraService } from "../../services/CameraService.js";

// Load cameras from backend and add them to the viewer
export async function loadCameras(viewer, cameraDrawer) {
    try {
        const cameras = await CameraService.getAll(); // Fetch all cameras
        console.log("[CameraLoader] Loaded cameras:", cameras.length);

        cameras.forEach(cam => {
            const { id, position, orientation } = cam;

            // Create camera entity in Cesium
            const cartesianPos = Cesium.Cartesian3.fromArray(position);
            const cameraOrientation = orientation ?
                Cesium.Quaternion.unpack(orientation) :
                Cesium.Transforms.headingPitchRollQuaternion(
                    cartesianPos,
                    new Cesium.HeadingPitchRoll(cam.heading || 0, cam.pitch || 0, cam.roll || 0)
                );

            cameraDrawer.viewer.entities.add({
                id,
                position: cartesianPos,
                orientation: cameraOrientation,
                properties: {
                    rotation: cam.heading || 0 // Store rotation from camera data
                },
                model: {
                    uri: "Cesium_Man.glb",  // Using the Cesium Man model from the project root
                    scale: 0.3,  // Reduced scale for better visibility
                    minimumPixelSize: 40,    // Minimum size in pixels
                    maximumScale: 2.0        // Maximum scale factor to prevent excessive growth
                }
            });

            // Store camera data in CameraDrawer for fly-to functionality after reload
            if (cameraDrawer.cameraDataList) {
                // Create viewer state for fly-to functionality
                const viewerState = {
                    destination: cartesianPos.clone(),
                    orientation: cameraOrientation.clone()
                };

                // Check if camera already exists in the list to avoid duplicates
                const existingIndex = cameraDrawer.cameraDataList.findIndex(c => c.id === id);
                if (existingIndex >= 0) {
                    cameraDrawer.cameraDataList[existingIndex] = {
                        id,
                        position,
                        orientation: cameraOrientation,
                        viewerState
                    };
                } else {
                    cameraDrawer.cameraDataList.push({
                        id,
                        position,
                        orientation: cameraOrientation,
                        viewerState
                    });
                }
            }
        });

    } catch (err) {
        console.error("[CameraLoader] Failed to load cameras:", err);
    }
}