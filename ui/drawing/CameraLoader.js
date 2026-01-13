import { CameraService } from "../../services/CameraService.js";

// Load cameras from backend and add them to the viewer
export async function loadCameras(viewer, cameraDrawer) {
    try {
        const cameras = await CameraService.getAll(); // Fetch all cameras
        console.log("[CameraLoader] Loaded cameras:", cameras.length);

        cameras.forEach(cam => {
            const { id, position, heading, pitch, roll } = cam;

            // Create camera entity in Cesium
            const cartesianPos = Cesium.Cartesian3.fromElements(...position);
            cameraDrawer.viewer.entities.add({
                id,
                position: cartesianPos,
                orientation: Cesium.Transforms.headingPitchRollQuaternion(
                    cartesianPos,
                    new Cesium.HeadingPitchRoll(heading, pitch, roll)
                ),
                billboard: {
                    image: "ui/assets/icons/camera.png",
                    scale: 0.05
                }
            });

            // Add a small direction line showing camera orientation
            const direction = Cesium.Matrix3.multiplyByVector(
                Cesium.Matrix3.fromQuaternion(
                    Cesium.Transforms.headingPitchRollQuaternion(
                        cartesianPos,
                        new Cesium.HeadingPitchRoll(heading, pitch, roll)
                    )
                ),
                Cesium.Cartesian3.UNIT_X,
                new Cesium.Cartesian3()
            );

            const endPoint = Cesium.Cartesian3.add(
                cartesianPos,
                Cesium.Cartesian3.multiplyByScalar(direction, 10, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );

            cameraDrawer.viewer.entities.add({
                id: `${id}-dir`,
                polyline: {
                    positions: [cartesianPos, endPoint],
                    width: 2,
                    material: Cesium.Color.YELLOW
                }
            });
        });
    } catch (err) {
        console.error("[CameraLoader] Failed to load cameras:", err);
    }
}