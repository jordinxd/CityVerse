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

        // Try both backends — call the exported `delete` method on each service.
        // The previous code called `deleteArea` / `deleteStructure` which don't exist,
        // so the requests were never sent (errors were swallowed). Use the correct names.
        try { 
            await AreaService.delete(id); 
        } catch (e) {
            // ignore if not found or not an area
        }

        try { 
            await StructureService.delete(id); 
        } catch (e) {
            // ignore if not found or not a structure
        }
        try {
            await CameraService.delete(id);
        } catch (e) {
            // ignore if not found or not a camera  
        }
        
        this.viewer.entities.removeById(id);

        console.log("Deleted:", id);
    }
}
