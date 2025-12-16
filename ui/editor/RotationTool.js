import { StructureService } from "../../services/StructureService.js";

export class RotationTool {
    constructor(viewer, selection) {
        this.viewer = viewer;
        this.selection = selection;
        this.active = false;
        this.dragging = false;
        this.lastX = null;


        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        this.handler.setInputAction(
    (movement) => {
        if (!this.active) return;

        this.dragging = true;
        this.lastX = movement.position.x;

        console.log("[RotationTool] drag start");
    },
    Cesium.ScreenSpaceEventType.LEFT_DOWN
);

this.handler.setInputAction(
    () => {
        if (!this.active) return;

        this.dragging = false;
        this.lastX = null;

        console.log("[RotationTool] drag end");
    },
    Cesium.ScreenSpaceEventType.LEFT_UP
);

this.handler.setInputAction(
    (movement) => {
        if (!this.active || !this.dragging) return;

        const entity = this.selection.getSelected();
        if (!entity) return;

        const currentX = movement.endPosition.x;
        const deltaX = currentX - this.lastX;
        this.lastX = currentX;

        if (Math.abs(deltaX) < 1) return;

        const currentRotation =
            entity.properties.rotation.getValue() ?? 0;

        const newRotation = currentRotation + deltaX * 0.3;

        console.log("[RotationTool] rotating to", newRotation);

        this.applyRotation(entity, newRotation);
    },
    Cesium.ScreenSpaceEventType.MOUSE_MOVE
);

    }

    

    activate() {
    this.active = true;

    const c = this.viewer.scene.screenSpaceCameraController;
    c.enableRotate = false;
    c.enableTranslate = false;
    c.enableZoom = false;
    c.enableTilt = false;
    c.enableLook = false;

    console.log("[RotationTool] activated (camera disabled)");
}



    deactivate() {
    this.active = false;
    this.dragging = false;

    const c = this.viewer.scene.screenSpaceCameraController;
    c.enableRotate = true;
    c.enableTranslate = true;
    c.enableZoom = true;
    c.enableTilt = true;
    c.enableLook = true;

    console.log("[RotationTool] deactivated (camera enabled)");
}




    onMouseMove(movement) {
    console.log("[RotationTool] mouse move");

    if (!this.active) {
        console.log("[RotationTool] inactive");
        return;
    }

    const entity = this.selection.getSelected();
    if (!entity) {
        console.log("[RotationTool] no selection");
        return;
    }

    const deltaX = movement.endPosition.x - movement.startPosition.x;
    console.log("[RotationTool] deltaX:", deltaX);

    if (Math.abs(deltaX) < 2) return;

    const current = entity.properties.rotation?.getValue() ?? 0;
    const nextRotation = current + deltaX * 0.2;

    console.log("[RotationTool] applying rotation:", nextRotation);

    this.applyRotation(entity, nextRotation);
}

async applyRotation(entity, rotation) {
    const id = entity.id;
console.log("[RotationTool] setting orientation");

    // Update Cesium immediately
    entity.properties.rotation = rotation;

    entity.orientation =
        Cesium.Transforms.headingPitchRollQuaternion(
            entity.position.getValue(Cesium.JulianDate.now()),
            new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(rotation),
                0,
                0
            )
        );

    try {
        await StructureService.update(id, {
            rotation
        });
    } catch (err) {
        console.error("Failed to persist rotation:", err);
    }
}


}
