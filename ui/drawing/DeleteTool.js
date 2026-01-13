import { AreaService } from "../../services/AreaService.js";
import { StructureService } from "../../services/StructureService.js";
import { CameraService } from "../../services/CameraService.js";

export class DeleteTool {
    constructor(viewer) {
        this.viewer = viewer;
        this.active = false;

        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

        this.handler.setInputAction((click) => {
            if (!this.active) return;

            const picked = viewer.scene.pick(click.position);
            if (!Cesium.defined(picked)) return;

            const entity = picked.id;
            if (!entity) return;

            // Determine the ID based on whether entity is an object or string
            const entityId = typeof entity === 'string' ? entity : entity.id;

            this.deleteEntity(entityId);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    activate() {
        console.log("Delete mode enabled");
        this.active = true;
    }

    deactivate() {
        console.log("Delete mode disabled");
        this.active = false;
    }

    async deleteEntity(originalId) {
        // Handle direction line IDs by extracting the base camera ID
        const id = originalId.includes('-dir') ? originalId.replace('-dir', '') : originalId;

        if (!confirm(`Delete entity: ${id}?`)) return;

        console.log("DeleteTool: Starting deletion for id:", id);

        // Try AreaService delete first
        let areaDeleted = false;
        try {
            const result = await AreaService.delete(id);
            console.log("DeleteTool: AreaService.delete returned:", result);
            areaDeleted = true;
        } catch (e) {
            console.warn("DeleteTool: AreaService.delete failed or not an area:", e);
        }

        // Try StructureService delete
        let structureDeleted = false;
        try {
            const result = await StructureService.delete(id);
            console.log("DeleteTool: StructureService.delete returned:", result);
            structureDeleted = true;
        } catch (e) {
            console.warn("DeleteTool: StructureService.delete failed or not a structure:", e);
        }

        let cameraDeleted = false;
        try {
            await CameraService.delete(id);
            cameraDeleted = true;
        } catch (e) {
            // ignore if not found or not a camera
            console.warn("DeleteTool: CameraService.delete failed or not a camera:", e);
        }

        if (!areaDeleted && !structureDeleted && !cameraDeleted) {
            console.error("DeleteTool: Entity not found in any service");
            return;
        }

        // Remove from viewer - remove both the main entity and direction line
        this.viewer.entities.removeById(id);
        this.viewer.entities.removeById(`${id}-dir`);

        console.log("DeleteTool: Removed entities from viewer for id:", id);
    }
}
