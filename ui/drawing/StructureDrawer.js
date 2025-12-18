import { StructureService } from "../../services/StructureService.js";

export class StructureDrawer {
    constructor(viewer) {
        this.viewer = viewer;
        this.active = false;
        this.currentType = null;

        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

        this.handler.setInputAction((click) => {
            if (!this.active || !this.currentType) return;

            let pos = viewer.scene.pickPosition(click.position);

            if (!Cesium.defined(pos)) {
                const ray = viewer.camera.getPickRay(click.position);
                pos = viewer.scene.globe.pick(ray, viewer.scene);
            }

            if (!Cesium.defined(pos)) return;

            const carto = Cesium.Cartographic.fromCartesian(pos);
            const lat = Cesium.Math.toDegrees(carto.latitude);
            const lon = Cesium.Math.toDegrees(carto.longitude);

            this.placeStructure(lon, lat);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    activate(type) {
        console.log("Structure mode:", type);
        this.active = true;
        this.currentType = type;
    }

    deactivate() {
        this.active = false;
    }

    async placeStructure(lon, lat) {
        const newId = crypto.randomUUID();

        const structure = {
            id: newId,
            type: this.currentType,
            position: [lon, lat],
            rotation: 0,
            width: 6,
            depth: 6,
            height: 10,
            style: { color: "#AA8833" }
        };

        console.log("Creating structure:", structure);
        try {
            const created = await StructureService.create(structure);
            console.log("Structure created on server:", created);
            this.spawnVisual(created ?? structure);
        } catch (err) {
            console.error("Failed to create structure:", err);
        }
    }

    spawnVisual(structure) {
        const [lon, lat] = structure.position;

        this.viewer.entities.add({
            id: structure.id,
            position: Cesium.Cartesian3.fromDegrees(lon, lat, structure.height / 2),
            orientation: Cesium.Transforms.headingPitchRollQuaternion(
            Cesium.Cartesian3.fromDegrees(lon, lat),
            new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(structure.rotation ?? 0),
                0,
                0
                )
            ),
            properties: {
            rotation: structure.rotation ?? 0
            },
            box: {
                dimensions: new Cesium.Cartesian3(
                    structure.width,
                    structure.depth,
                    structure.height
                ),
                material: Cesium.Color.fromCssColorString(
                    structure.style.color ?? "#AA8833"
                )
            }
        });
    }
}