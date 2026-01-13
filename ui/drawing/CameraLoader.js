import { CameraService } from "../../services/CameraService.js";

// Load cameras from backend and add them to the viewer
export async function loadCameras(viewer, cameraDrawer) {
    try {
        const cameras = await CameraService.getAll(); // Fetch all cameras
        console.log("[CameraLoader] Loaded cameras:", cameras.length);

        cameras.forEach(cam => {
            const { id, position, rotation } = cam;

            // Create camera entity in Cesium
            const cartesianPos = Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2]);

            // Create orientation based on rotation (heading)
            const cameraOrientation = Cesium.Transforms.headingPitchRollQuaternion(
                cartesianPos,
                new Cesium.HeadingPitchRoll(
                    Cesium.Math.toRadians(rotation || 0), // Use rotation as heading
                    0, // Default pitch
                    0  // Default roll
                )
            );

            cameraDrawer.viewer.entities.add({
                id,
                position: cartesianPos,
                orientation: cameraOrientation,
                properties: {
                    rotation: rotation || 0 // Store rotation from camera data
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
                // Check if camera already exists in the list to avoid duplicates
                const existingIndex = cameraDrawer.cameraDataList.findIndex(c => c.id === id);
                if (existingIndex >= 0) {
                    cameraDrawer.cameraDataList[existingIndex] = {
                        id,
                        type: cam.type || "camera",
                        position,
                        rotation: rotation || 0,
                        height: position[2]
                    };
                } else {
                    cameraDrawer.cameraDataList.push({
                        id,
                        type: cam.type || "camera",
                        position,
                        rotation: rotation || 0,
                        height: position[2]
                    });
                }
            }
        });

    } catch (err) {
        console.error("[CameraLoader] Failed to load cameras:", err);
    }
}