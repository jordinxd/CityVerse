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
            if (!entity || !entity.id) return;

            this.deleteEntity(entity.id);
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

    async deleteEntity(id) {
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
        try {
            await CameraService.delete(id);
        } catch (e) {
            // ignore if not found or not a camera  
        }
        
        this.viewer.entities.removeById(id);

        if (!areaDeleted && !structureDeleted) {
            console.error("DeleteTool: Entity not found in either service");
            return;
        }

        // Remove from viewer
        const removed = this.viewer.entities.removeById(id);
        console.log("DeleteTool: Removed from viewer - success:", removed, "id:", id);
    }
}
