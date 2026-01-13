import { CameraService } from "../../services/CameraService.js";

// CameraDrawer - Handles placing, rendering, and managing cameras in the Cesium viewer
export class CameraDrawer {
    constructor(viewer) {
        this.viewer = viewer;
        this.placementActive = false;
        this.cameraPoints = [];
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    }

    startPlacement() {
        if (this.placementActive) return;
        this.placementActive = true;
        console.log("[CameraDrawer] Placement mode enabled");

        this.handler.setInputAction(async (click) => {
            if (!this.placementActive) return;

            let pos = this.viewer.scene.pickPosition(click.position);
            if (!Cesium.defined(pos)) {
                console.warn("[CameraDrawer] No pick position found.");
                return;
            }

            const carto = Cesium.Cartographic.fromCartesian(pos);
            const lon = Cesium.Math.toDegrees(carto.longitude);
            const lat = Cesium.Math.toDegrees(carto.latitude);

            let height = carto.height || this.viewer.scene.globe.getHeight(carto) || 2;
            height = Math.max(height, 2) + 2;

            const hInput = prompt("Camera height (meters):", height.toFixed(1));
            if (hInput !== null) height = parseFloat(hInput);

            const headingDeg = parseFloat(prompt("Heading (degrees, 0-360):", "0"));
            const pitchDeg = parseFloat(prompt("Pitch (degrees, up/down):", "0"));

            const heading = Cesium.Math.toRadians(headingDeg);
            const pitch = Cesium.Math.toRadians(pitchDeg);
            const roll = 0;

            // Generate UUID
            const id = crypto.randomUUID();

            const position = Cesium.Cartesian3.fromDegrees(lon, lat, height);

            // Add camera billboard
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

            // Direction line
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

            // Backend data
            const camData = {
                id,
                position: [position.x, position.y, position.z],
                heading,
                pitch,
                roll,
                height
            };

            this.cameraPoints.push(camData);
            console.log("[CameraDrawer] Camera saved:", camData);

            await CameraService.create(camData);
            console.log("[CameraDrawer] Camera stored in backend:", id);

            this.placementActive = false;

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    async saveCurrentCamera() {
        const cam = this.viewer.camera;
        const pos = cam.position;

        const id = crypto.randomUUID(); // UUID for saved viewpoints

        const saved = {
            id,
            position: [pos.x, pos.y, pos.z],
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
        const entity = this.viewer.entities.getById(id);
        const dir = this.viewer.entities.getById(`${id}-dir`);

        if (entity) this.viewer.entities.remove(entity);
        if (dir) this.viewer.entities.remove(dir);

        console.log("[CameraDrawer] Removed camera entity:", id);

        await CameraService.delete(id);
        console.log("[CameraDrawer] Camera removed from backend:", id);
    }
}
