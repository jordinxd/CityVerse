import { StructureService } from "../../services/StructureService.js";
import { CameraService } from "../../services/CameraService.js";

/**
 * RotationTool: Three-axis local-space rotation gizmo
 * 
 * Features:
 * - Red (X), Green (Y), Blue (Z) rotation rings
 * - Rings oriented with object's local axes
 * - Intuitive cumulative rotations around local axes
 * - Real-time visual feedback
 * - Camera locked during drag
 * - Backend persistence on completion
 */
export class RotationTool {
    constructor(viewer, selection) {
        this.viewer = viewer;
        this.selection = selection;

        this.active = false;
        this.isDragging = false;
        this.activeAxis = null;

        // Drag state
        this.dragStartPosition = null;
        this.dragStartRotation = null;
        this.dragStartOrientation = null;

        // Gizmo rings
        this.ringEntities = [];
        this.RING_RADIUS = 20;

        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        // Mouse down: select rotation axis
        this.handler.setInputAction(
            (movement) => this.onMouseDown(movement),
            Cesium.ScreenSpaceEventType.LEFT_DOWN
        );

        // Mouse move: rotate while dragging
        this.handler.setInputAction(
            (movement) => this.onMouseMove(movement),
            Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );

        // Mouse up: commit rotation
        this.handler.setInputAction(
            (movement) => this.onMouseUp(movement),
            Cesium.ScreenSpaceEventType.LEFT_UP
        );
    }

    activate() {
        console.log("[RotationTool] Activated - calling showGizmo");
        this.active = true;
        this.showGizmo();
    }

    // Deactivate the rotation tool
    deactivate() {
        console.log("[RotationTool] Deactivated");
        this.active = false;
        this.clearDrag();
        this.clearGizmo();
    }

    /**
     * Create three rotation rings, one for each axis (X, Y, Z)
     * Rings are oriented with object's local axes
     */
    showGizmo() {
        console.log("[RotationTool] showGizmo called, active:", this.active);
        if (!this.active) {
            console.log("[RotationTool] Tool not active, returning");
            return;
        }

        this.clearGizmo();

        const selected = this.selection.getSelected();
        console.log("[RotationTool] Selected entity:", selected);
        if (!selected) {
            console.log("[RotationTool] No selected entity, returning");
            return;
        }

        const pos = selected.position.getValue(Cesium.JulianDate.now());
        console.log("[RotationTool] Entity position:", pos);
        if (!pos) {
            console.log("[RotationTool] No position, returning");
            return;
        }

        // Validate position values - ensure they're finite numbers
        if (!this.isFiniteCartesian3(pos)) {
            console.warn("[RotationTool] Invalid position for gizmo:", pos);
            return;
        }

        // Get entity's current rotation
        let rotation = 0;
        if (selected.properties?.rotation) {
            rotation = selected.properties.rotation.getValue() || 0;
        }

        // Validate rotation value
        if (!Number.isFinite(rotation)) {
            console.warn("[RotationTool] Invalid rotation value:", rotation);
            rotation = 0;
        }

        // Three axis definitions
        const axes = [
            { name: "x", color: Cesium.Color.RED, axis: Cesium.Cartesian3.UNIT_X },
            { name: "y", color: Cesium.Color.GREEN, axis: Cesium.Cartesian3.UNIT_Y },
            { name: "z", color: Cesium.Color.BLUE, axis: Cesium.Cartesian3.UNIT_Z }
        ];

        axes.forEach(({ name, color, axis }) => {
            console.log("[RotationTool] Creating ring for axis:", name);
            const ring = this.createRotationRing(pos, color, name, axis, rotation);
            if (ring) {
                console.log("[RotationTool] Successfully created ring for axis:", name);
                this.ringEntities.push(ring);
            } else {
                console.warn("[RotationTool] Failed to create ring for axis:", name);
            }
        });

        console.log("[RotationTool] Gizmo created with", this.ringEntities.length, "rotation rings");
    }

    /**
     * Create a single rotation ring
     * Position it based on object rotation so rings are local-space aligned
     */
    createRotationRing(position, color, axisName, axisVector, entityRotation) {
        console.log("[RotationTool] Creating ring for axis:", axisName, "at position:", position);
        const points = [];
        const steps = 32;

        // Validate position
        if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
            console.warn("[RotationTool] Invalid position for ring", axisName);
            return null;
        }

        // Get the current orientation quaternion
        const selected = this.selection.getSelected();
        let orientationQuat;
        if (selected && selected.orientation) {
            orientationQuat = selected.orientation.getValue(Cesium.JulianDate.now());
            console.log("[RotationTool] Using entity's orientation:", orientationQuat);
        } else {
            // Fall back to Z-axis rotation if no orientation yet
            orientationQuat = Cesium.Quaternion.fromAxisAngle(
                Cesium.Cartesian3.UNIT_Z,
                Cesium.Math.toRadians(entityRotation)
            );
            console.log("[RotationTool] Using fallback orientation, rotation:", entityRotation);
        }

        // Validate quaternion components
        if (!Number.isFinite(orientationQuat.x) || !Number.isFinite(orientationQuat.y) ||
            !Number.isFinite(orientationQuat.z) || !Number.isFinite(orientationQuat.w)) {
            console.warn("[RotationTool] Invalid quaternion components for ring", axisName, ":", orientationQuat);
            orientationQuat = Cesium.Quaternion.IDENTITY;
        }

        // Get rotation matrix from quaternion
        const rotMatrix = Cesium.Matrix3.fromQuaternion(orientationQuat);
        console.log("[RotationTool] Created rotation matrix for axis:", axisName);

        // Determine which plane to draw the ring on based on axis
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Cesium.Math.TWO_PI;
            let pointLocal = new Cesium.Cartesian3();

            if (axisName === "x") {
                // YZ plane rotation around X
                pointLocal = new Cesium.Cartesian3(
                    0,
                    this.RING_RADIUS * Math.cos(angle),
                    this.RING_RADIUS * Math.sin(angle)
                );
            } else if (axisName === "y") {
                // XZ plane rotation around Y
                pointLocal = new Cesium.Cartesian3(
                    this.RING_RADIUS * Math.cos(angle),
                    0,
                    this.RING_RADIUS * Math.sin(angle)
                );
            } else if (axisName === "z") {
                // XY plane rotation around Z
                pointLocal = new Cesium.Cartesian3(
                    this.RING_RADIUS * Math.cos(angle),
                    this.RING_RADIUS * Math.sin(angle),
                    0
                );
            }

            // Rotate local ring point by entity's current orientation
            const pointRotated = Cesium.Matrix3.multiplyByVector(
                rotMatrix,
                pointLocal,
                new Cesium.Cartesian3()
            );

            // Validate rotated point
            if (!this.isFiniteCartesian3(pointRotated)) {
                console.warn("[RotationTool] Invalid rotated point for ring", axisName, ":", pointRotated);
                return null;
            }

            // Convert to world position
            const worldPoint = Cesium.Cartesian3.add(
                position,
                pointRotated,
                new Cesium.Cartesian3()
            );

            // Validate world point
            if (!this.isFiniteCartesian3(worldPoint)) {
                console.warn("[RotationTool] Invalid world point for ring", axisName, ":", worldPoint);
                return null;
            }

            points.push(worldPoint);
        }

        // Close the ring
        if (points.length > 0) {
            points.push(points[0]);
        }

        if (points.length < 2) {
            console.warn("[RotationTool] Invalid points array for ring", axisName, "length:", points.length);
            return null;
        }

        const ring = this.viewer.entities.add({
            polyline: {
                positions: points,
                width: 3,
                material: color,
                clampToGround: false,
                zIndex: 100
            }
        });

        console.log("[RotationTool] Created visible ring entity for axis:", axisName, "with", points.length, "points");

        ring.isGizmo = true;
        ring.axis = axisName;
        ring.isRotationRing = true;

        // Also create invisible pickup polyline for easier selection
        const pickupRing = this.viewer.entities.add({
            polyline: {
                positions: points,
                width: 15,
                material: new Cesium.Color(0, 0, 0, 0),
                clampToGround: false,
                zIndex: 99
            }
        });

        pickupRing.isGizmo = true;
        pickupRing.axis = axisName;
        pickupRing.isPickHelper = true;

        this.ringEntities.push(pickupRing);

        return ring;
    }

    clearGizmo() {
        this.ringEntities.forEach((e) => {
            try {
                this.viewer.entities.remove(e);
            } catch (err) {
                console.warn("[RotationTool] Error removing ring:", err);
            }
        });
        this.ringEntities = [];
    }

    /**
     * Mouse down: detect if clicking a ring
     */
    onMouseDown(movement) {
        if (!this.active) return;

        const pickedAxis = this.getPickedAxis(movement.position);
        if (!pickedAxis) return;

        console.log("[RotationTool] Rotation started on axis:", pickedAxis);

        const selected = this.selection.getSelected();
        if (!selected) return;

        this.isDragging = true;
        this.activeAxis = pickedAxis;
        this.dragStartPosition = movement.position;
        this.dragStartRotation = selected.properties?.rotation?.getValue() || 0;
        this.dragStartOrientation = selected.orientation ?
            selected.orientation.getValue(Cesium.JulianDate.now()) :
            Cesium.Quaternion.IDENTITY;

        // Lock camera during drag
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
        this.viewer.scene.screenSpaceCameraController.enableZoom = false;
        this.viewer.scene.screenSpaceCameraController.enablePan = false;

        // Visual feedback: highlight the ring
        const ring = this.ringEntities.find(
            (e) => e.isRotationRing && e.axis === pickedAxis
        );
        if (ring && ring.polyline) {
            ring.polyline.width = 5;
        }
    }

    /**
     * Mouse move: update rotation while dragging
     */
    onMouseMove(movement) {
        if (!this.isDragging || !this.activeAxis) return;

        const selected = this.selection.getSelected();
        if (!selected) return;

        // Calculate screen delta in pixels
        const deltaX = movement.endPosition.x - this.dragStartPosition.x;
        const deltaY = movement.endPosition.y - this.dragStartPosition.y;

        // Convert pixels to rotation angle (empirically, ~2px = 1 degree)
        const deltaPixels = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const sign = deltaX > 0 ? 1 : -1;
        const deltaRotation = sign * (deltaPixels / 2);

        // Get the local axis vector to rotate around
        let localAxis;
        if (this.activeAxis === "x") {
            localAxis = Cesium.Cartesian3.UNIT_X;
        } else if (this.activeAxis === "y") {
            localAxis = Cesium.Cartesian3.UNIT_Y;
        } else if (this.activeAxis === "z") {
            localAxis = Cesium.Cartesian3.UNIT_Z;
        }

        // Get current orientation from drag start (to accumulate rotations properly)
        let currentOrientation = this.dragStartOrientation.clone();

        // Create rotation quaternion for the drag amount around the selected axis
        const rotationQuat = Cesium.Quaternion.fromAxisAngle(
            localAxis,
            Cesium.Math.toRadians(deltaRotation)
        );

        // Apply the rotation to the current orientation
        // For local space rotation, multiply: newOrientation = rotationQuat * currentOrientation
        const newOrientation = Cesium.Quaternion.multiply(
            rotationQuat,
            currentOrientation,
            new Cesium.Quaternion()
        );

        // Update the entity's orientation
        selected.orientation = newOrientation;

        // For backward compatibility, also update the rotation property with the Z-axis heading
        if (pos) {
            const headingPitchRoll = Cesium.Transforms.fixedFrameToHeadingPitchRoll(pos, selected.orientation);
            const headingDegrees = Cesium.Math.toDegrees(headingPitchRoll.heading);
            selected.properties.rotation = ((headingDegrees % 360) + 360) % 360;
        }

        console.log("[RotationTool] Rotating", this.activeAxis, "by", deltaRotation, "° - accumulated 3D rotation");
    }

    /**
     * Mouse up: commit final rotation
     */
    async onMouseUp(movement) {
        if (!this.isDragging) return;

        const selected = this.selection.getSelected();
        if (!selected) return;

        // Unlock camera
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        this.viewer.scene.screenSpaceCameraController.enableZoom = true;
        this.viewer.scene.screenSpaceCameraController.enablePan = true;

        // Unhighlight ring
        const ring = this.ringEntities.find(
            (e) => e.isRotationRing && e.axis === this.activeAxis
        );
        if (ring && ring.polyline) {
            ring.polyline.width = 3;
        }

        const finalRotation = selected.properties?.rotation?.getValue() || 0;
        console.log("[RotationTool] Rotation ended. Final rotation:", finalRotation);

        // Sync to backend (includes complete entity data to prevent overwrites)
        await this.syncToBackend(selected, finalRotation);

        // Refresh gizmo to show rings in final orientation
        this.showGizmo();

        this.clearDrag();
    }

    /**
     * Apply rotation to entity (used on drag end for final sync)
     */
    applyRotation(entity, rotation) {
        // Normalize rotation to 0-360
        const normalized = ((rotation % 360) + 360) % 360;

        // Store in properties
        entity.properties.rotation = normalized;
    }

    /**
     * Sync rotation to backend with complete entity data
     */
    async syncToBackend(entity, rotation) {
        try {
            // Get complete current entity data to avoid overwrites
            const position = entity.position.getValue(Cesium.JulianDate.now());
            const cartographic = Cesium.Cartographic.fromCartesian(position);

            // Sync with complete entity structure to prevent data loss
            const result = await StructureService.update(entity.id, {
                id: entity.id,
                type: entity.properties?.type?.getValue(),
                position: [
                    Cesium.Math.toDegrees(cartographic.longitude),
                    Cesium.Math.toDegrees(cartographic.latitude)
                ],
                rotation: rotation,
                width: entity.properties?.width?.getValue(),
                depth: entity.properties?.depth?.getValue(),
                height: entity.properties?.height?.getValue(),
                style: entity.properties?.style?.getValue()
            });
            console.log("[RotationTool] Rotation synced to backend:", result);
        } catch (err) {
            console.error("[RotationTool] Failed to sync rotation:", err);
            // Rollback to start rotation on error
            entity.properties.rotation = this.dragStartRotation;
            const pos = entity.position.getValue(Cesium.JulianDate.now());
            if (pos) {
                entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
                    pos,
                    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(this.dragStartRotation), 0, 0)
                );
            }
        }
    }

    /**
     * Get which ring axis was clicked
     */
    getPickedAxis(screenPos) {
        const picks = this.viewer.scene.drillPick(screenPos);

        for (const pick of picks) {
            const entity = pick.id;
            if (entity && entity.isGizmo && entity.axis && entity.isRotationRing) {
                return entity.axis;
            }
        }

        return null;
    }

    clearDrag() {
        this.isDragging = false;
        this.activeAxis = null;
        this.dragStartPosition = null;
        this.dragStartRotation = null;
        this.dragStartOrientation = null;
    }

    /**
     * Check if tool handles this click (prevents selection changes)
     */
    handlesClick(screenPos) {
        return this.active && this.getPickedAxis(screenPos) !== null;
    }

    isFiniteCartesian3(c) {
        return (
            c &&
            Number.isFinite(c.x) &&
            Number.isFinite(c.y) &&
            Number.isFinite(c.z)
        );
    }
}
