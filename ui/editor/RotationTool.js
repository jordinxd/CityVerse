import { StructureService } from "../../services/StructureService.js";

export class RotationTool {
    constructor(viewer, selection) {
        this.viewer = viewer;
        this.selection = selection;

        this.active = false;
        this.dragging = false;

        this.startAngle = null;
        this.startRotation = null;

        this.ringEntity = null;
        this.ringRadius = 15;


        this.handler = new Cesium.ScreenSpaceEventHandler(
            viewer.scene.canvas
        );

        // ─────────────────────────────────────────────
        // DRAG START
        // ─────────────────────────────────────────────
        this.handler.setInputAction(
            (movement) => {
                if (!this.active) return;

                const entity = this.selection.getSelected();
                if (!entity) return;

                const angle = this.getAngleToMouse(movement);
                if (angle === null) return;

                this.dragging = true;
                this.startAngle = angle;
                this.startRotation =
                    entity.properties.rotation?.getValue() ?? 0;

                console.log("[RotationTool] drag start");
            },
            Cesium.ScreenSpaceEventType.LEFT_DOWN
        );

        // ─────────────────────────────────────────────
        // DRAG MOVE
        // ─────────────────────────────────────────────
        this.handler.setInputAction(
            (movement) => {
                if (!this.active || !this.dragging) return;

                const entity = this.selection.getSelected();
                if (!entity) return;

                const currentAngle = this.getAngleToMouse(movement);
                if (currentAngle === null) return;

                const deltaAngle =
                    currentAngle - this.startAngle;

                const deltaDegrees =
                    Cesium.Math.toDegrees(deltaAngle);

                const newRotation =
                    this.startRotation + deltaDegrees;

                this.applyRotation(entity, newRotation);
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );

        // ─────────────────────────────────────────────
        // DRAG END
        // ─────────────────────────────────────────────
        this.handler.setInputAction(
    async () => {
        if (!this.active || !this.dragging) return;

        this.dragging = false;

        const entity = this.selection.getSelected();
        if (entity) {
            await this.persistRotation(entity);
        }

        console.log("[RotationTool] drag end → rotation persisted");
    },
    Cesium.ScreenSpaceEventType.LEFT_UP
);

    }

    // ─────────────────────────────────────────────
    // TOOL LIFECYCLE
    // ─────────────────────────────────────────────
    activate() {
        this.active = true;

        const entity = this.selection.getSelected();
if (entity) {
    this.showRotationRing(entity);
}


        const c =
            this.viewer.scene.screenSpaceCameraController;
        c.enableRotate = false;
        c.enableTranslate = false;
        c.enableZoom = false;
        c.enableTilt = false;
        c.enableLook = false;

        console.log("[RotationTool] activated");
    }

    deactivate() {
        this.active = false;
        this.dragging = false;

        this.hideRotationRing();


        const c =
            this.viewer.scene.screenSpaceCameraController;
        c.enableRotate = true;
        c.enableTranslate = true;
        c.enableZoom = true;
        c.enableTilt = true;
        c.enableLook = true;

        console.log("[RotationTool] deactivated");
    }

    // ─────────────────────────────────────────────
    // CORE MATH
    // ─────────────────────────────────────────────
    getAngleToMouse(movement) {
    const screenPos =
        movement.endPosition ?? movement.position;

    if (!screenPos) return null;

    const ray =
        this.viewer.camera.getPickRay(screenPos);
    if (!ray) return null;

    const entity = this.selection.getSelected();
    if (!entity) return null;

    const center =
        entity.position.getValue(
            this.viewer.clock.currentTime
        );

    // Define plane: horizontal through center
    const plane = new Cesium.Plane(
        Cesium.Cartesian3.UNIT_Y,
        -center.y
    );

    const hit =
        Cesium.IntersectionTests.rayPlane(
            ray,
            plane
        );

    if (!hit) return null;

    // Vector from center to hit point
    const dx = hit.x - center.x;
    const dz = hit.z - center.z;

    // Ignore distance → only angle matters
    return Math.atan2(dz, dx);
}


    // ─────────────────────────────────────────────
    // APPLY ROTATION (VISUAL ONLY)
    // ─────────────────────────────────────────────
    applyRotation(entity, rotation) {
    const normalized =
        ((rotation % 360) + 360) % 360;

    // Visual state only
    entity.properties.rotation = normalized;

    entity.orientation =
        Cesium.Transforms.headingPitchRollQuaternion(
            entity.position.getValue(
                Cesium.JulianDate.now()
            ),
            new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(normalized),
                0,
                0
            )
        );
}


    showRotationRing(entity) {
    this.hideRotationRing();

    const position = entity.position.getValue(
        this.viewer.clock.currentTime
    );

    this.ringEntity = this.viewer.entities.add({
        position,
        ellipse: {
            semiMajorAxis: this.ringRadius,
            semiMinorAxis: this.ringRadius,
            height: 0.1,
            outline: true,
            outlineColor: Cesium.Color.YELLOW,
            outlineWidth: 3,
            fill: false
        }
    });

    console.log("[RotationTool] rotation ring shown");
}

hideRotationRing() {
    if (this.ringEntity) {
        this.viewer.entities.remove(this.ringEntity);
        this.ringEntity = null;
        console.log("[RotationTool] rotation ring hidden");
    }
}



    // ─────────────────────────────────────────────
    // BACKEND SAVE (ONCE)
    // ─────────────────────────────────────────────
    async persistRotation(entity) {
        try {
            const rotation =
                entity.properties.rotation?.getValue() ?? 0;

            await StructureService.update(entity.id, {
                rotation
            });

            console.log("[RotationTool] rotation saved");
        } catch (err) {
            console.error(
                "Failed to persist rotation:",
                err
            );
        }
    }
}
