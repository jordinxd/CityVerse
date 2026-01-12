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
            style: { color: "#ff00b4" }
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
                    structure.style.color ?? "#ff00f9"
                )
            }
        });
    }

    // Update an existing structure's visual representation
    updateVisual(structureId, updates) {
        const entity = this.viewer.entities.getById(structureId);
        if (!entity) {
            console.warn("Structure entity not found for update:", structureId);
            return false;
        }

        // Update rotation if provided
        if (updates.rotation !== undefined) {
            const [lon, lat] = updates.position || this.getStructurePosition(structureId);

            // Update the orientation based on new rotation
            entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
                Cesium.Cartesian3.fromDegrees(lon, lat),
                new Cesium.HeadingPitchRoll(
                    Cesium.Math.toRadians(updates.rotation),
                    0,
                    0
                )
            );

            // Update the properties to reflect the new rotation
            if (entity.properties) {
                entity.properties.rotation = updates.rotation;
            }
        }

        // Update position if provided
        if (updates.position) {
            const [lon, lat] = updates.position;
            entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, updates.height || 5); // Default height if not provided
        }

        console.log("[StructureDrawer] Updated structure visual:", structureId, updates);
        return true;
    }

    // Helper method to get current structure position
    getStructurePosition(structureId) {
        const entity = this.viewer.entities.getById(structureId);
        if (!entity || !entity.position) {
            console.warn("Could not get position for structure:", structureId);
            return [0, 0]; // Default fallback
        }

        const currentPosition = entity.position.getValue(Cesium.JulianDate.now());
        const cartographic = Cesium.Cartographic.fromCartesian(currentPosition);
        return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
    }
}