import { CameraService } from "../../services/CameraService.js";

export class CameraDrawer {

    constructor(viewer) {
        // Handles placing, rendering, and managing cameras in the Cesium viewer.
        this.viewer = viewer;
        this.placementActive = false;
        this.cameraPoints = [];
        this.cameraIdCounter = 0;

        // Input handler for mouse clicks
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    }

    startPlacement() {
        if (this.placementActive) return;
        this.placementActive = true;
        console.log("[CameraDrawer] Placement mode enabled");

        // Handle left-click to place a camera
        this.handler.setInputAction(async (click) => {
            if (!this.placementActive) return;

            // Try picking 3D position
            let pos = this.viewer.scene.pickPosition(click.position);
            if (!Cesium.defined(pos)) {
                console.warn("[CameraDrawer] No pick position found.");
                return;
            }

            // Convert cartesian → lon/lat/height
            const carto = Cesium.Cartographic.fromCartesian(pos);
            const lon = Cesium.Math.toDegrees(carto.longitude);
            const lat = Cesium.Math.toDegrees(carto.latitude);

            // Minimum height offset
            let height = carto.height || this.viewer.scene.globe.getHeight(carto) || 2;
            height = Math.max(height, 2) + 2;

            // User inputs
            const hInput = prompt("Camera height (meters):", height.toFixed(1));
            if (hInput !== null) height = parseFloat(hInput);

            const headingInput = prompt("Heading (degrees, 0-360):", "0");
            const pitchInput = prompt("Pitch (degrees, up/down):", "0");

            const heading = Cesium.Math.toRadians(parseFloat(headingInput));
            const pitch = Cesium.Math.toRadians(parseFloat(pitchInput));

            // Generate unique id (local)
            const id = `camera-${this.cameraIdCounter++}`;

            // Camera entity position
            const position = Cesium.Cartesian3.fromDegrees(lon, lat, height);

            // Create camera icon
            this.viewer.entities.add({
                id,
                position,
                orientation: Cesium.Transforms.headingPitchRollQuaternion(
                    position,
                    new Cesium.HeadingPitchRoll(heading, pitch, 0)
                ),
                billboard: {
                    image: "ui/assets/icons/camera.png",
                    scale: 0.05
                }
            });

            // Create direction line (visualizes heading)
            const direction = Cesium.Matrix3.multiplyByVector(
                Cesium.Matrix3.fromQuaternion(
                    Cesium.Transforms.headingPitchRollQuaternion(
                        position,
                        new Cesium.HeadingPitchRoll(heading, pitch, 0)
                    )
                ),
                Cesium.Cartesian3.UNIT_X,
                new Cesium.Cartesian3()
            );

            const endPoint = Cesium.Cartesian3.add(
                position,
                Cesium.Cartesian3.multiplyByScalar(direction, 10, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );

            this.viewer.entities.add({
                id: `${id}-dir`,
                polyline: {
                    positions: [position, endPoint],
                    width: 2,
                    material: Cesium.Color.YELLOW
                }
            });

            // Data for backend
            const camData = {
                id,
                position: [position.x, position.y, position.z],
                heading,
                pitch,
                roll: 0,
                height
            };

            this.cameraPoints.push(camData);
            console.log("[CameraDrawer] Camera saved:", camData);

            // Store in backend
            await CameraService.create(camData);
            console.log("[CameraDrawer] Camera stored in backend:", id);

            this.placementActive = false;

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    async saveCurrentCamera() {
        // Save viewer's current camera as a stored viewpoint
        const cam = this.viewer.camera;
        const position = cam.position;

        const saved = {
            id: `saved-${this.cameraPoints.length}`,
            position: [position.x, position.y, position.z],
            height: cam.positionCartographic.height,
            heading: cam.heading,
            pitch: cam.pitch,
            roll: cam.roll
        };

        this.cameraPoints.push(saved);
        console.log("[CameraDrawer] Camera viewpoint saved:", saved);

        await CameraService.create(saved);
        console.log("[CameraDrawer] Camera saved to backend:", saved.id);
    }

    async removeEntityFromViewer(id) {
        // Removes camera icon + direction line
        const entity = this.viewer.entities.getById(id);
        const dir = this.viewer.entities.getById(`${id}-dir`);
        if (entity) this.viewer.entities.remove(entity);
        if (dir) this.viewer.entities.remove(dir);
        console.log("[CameraDrawer] Removed camera entity:", id);

        // Remove from backend
        await CameraService.delete(id);
        console.log("[CameraDrawer] Camera removed from backend:", id);
    }
}
