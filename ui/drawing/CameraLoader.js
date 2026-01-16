import { CameraService } from "../../services/CameraService.js";

/**
 * Loads all cameras from the database and visualizes them on the map.
 * @param {Cesium.Viewer} viewer - The main Cesium viewer instance.
 * @param {CameraDrawer} cameraDrawer - The drawer instance to keep state synced.
 */
export async function loadCameras(viewer, cameraDrawer) {
    try {
        // 1. Fetch data from Backend (Database)
        const cameras = await CameraService.getAll();
        console.log(`[CameraLoader] Found ${cameras.length} cameras in database.`);

        // 2. Loop through each camera and place it on the map
        cameras.forEach(cam => {
            const { id, position, rotation, imagePath } = cam;

            // Safety check: skip if position is missing or invalid
            if (!position || position.length < 3) {
                console.warn(`[CameraLoader] Skipping camera ${id}: Invalid position data.`, position);
                return;
            }

            // Convert stored [lon, lat, height] to Cesium Cartesian3
            const cartesianPos = Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2]);

            // Calculate orientation based on stored rotation
            // Note: We assume the stored rotation is the heading in degrees
            const headingRadians = Cesium.Math.toRadians(rotation || 0);
            const cameraOrientation = Cesium.Transforms.headingPitchRollQuaternion(
                cartesianPos,
                new Cesium.HeadingPitchRoll(headingRadians, 0, 0)
            );

            // 3. Create the Visual Entity (Cesium Man)
            viewer.entities.add({
                id: id, // Use the Database ID (UUID)
                position: cartesianPos,
                orientation: cameraOrientation,
                properties: new Cesium.PropertyBag({
                    rotation: rotation || 0,
                    agentId: id // Custom property to help identification
                }),
                model: {
                    uri: "Cesium_Man.glb",
                    scale: 0.3,
                    minimumPixelSize: 40,
                    maximumScale: 2.0
                }
            });

            // 4. Sync with CameraDrawer state
            // This ensures the CameraDrawer knows about these cameras (e.g. for flyTo or selection)
            if (cameraDrawer && cameraDrawer.cameraDataList) {
                cameraDrawer.cameraDataList.push({
                    id: id,
                    position: position,
                    rotation: rotation || 0,
                    height: position[2],
                    imagePath: imagePath || null
                });
            }
        });

        console.log("[CameraLoader] All cameras visualized.");

    } catch (err) {
        console.error("[CameraLoader] Failed to load cameras from database:", err);
    }
}