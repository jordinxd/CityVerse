import { GizmoVisualizer } from "./GizmoVisualizer.js";
import { StructureService } from "../../services/StructureService.js";
import { CameraService } from "../../services/CameraService.js";
import { latlonFromXY } from "../../Core/CoordinateUtils.js";

/**
 * MoveTool: Translate gizmo with object-space axes and axis-locking
 * 
 * Features:
 * - Shows X/Y/Z object-space axes (aligned with entity rotation)
 * - Axis-locked dragging (X, Y, or Z independently)
 * - Live visual updates while dragging
 * - Commits changes on mouse release
 * - Reliable picking even for thin polylines
 * - Prevents gizmo clicks from changing selection
 * - Updates JSON via backend service
 */

export class MoveTool {
    constructor(viewer, selection) {
        this.viewer = viewer;
        this.selection = selection;
        this.gizmoEntities = [];
        this.active = false;

        // Drag state
        this.isDragging = false;
        this.activeAxis = null;
        this.dragStartPosition = null;
        this.dragStartEntityPosition = null;

        // Gizmo configuration
        this.GIZMO_SCALE = 15; // Length of axis arrows
        this.AXIS_WIDTH = 6;
        this.AXIS_PICKUP_WIDTH = 15; // Wider for easier picking
        this.CONE_HEIGHT = 3;
        this.CONE_RADIUS = 1.5;

        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        // Mouse down: start drag on gizmo axis
        this.handler.setInputAction(
            (movement) => this.onMouseDown(movement),
            Cesium.ScreenSpaceEventType.LEFT_DOWN
        );

        // Mouse move: update position while dragging
        this.handler.setInputAction(
            (movement) => this.onMouseMove(movement),
            Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );

        // Mouse up: commit final position
        this.handler.setInputAction(
            (movement) => this.onMouseUp(movement),
            Cesium.ScreenSpaceEventType.LEFT_UP
        );
        this.moving = false;
        this.originalPosition = null;
        this.movementStart = null;

        // Initialize handler but don't set actions until activated
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    }

    setupHandlers() {
        // Mouse down to start moving (only when we have a selected entity)
        this.handler.setInputAction((movement) => {
            if (!this.active) return;

            const selected = this.selection.getSelected();
            if (!selected) return; // Don't start moving if nothing is selected

            this.moving = true;
            this.originalPosition = selected.position.getValue(Cesium.JulianDate.now());
            this.movementStart = movement.position;

            // Disable camera controls while moving
            const c = this.viewer.scene.screenSpaceCameraController;
            c.enableRotate = false;
            c.enableTranslate = false;
            c.enableZoom = false;
            c.enableTilt = false;
            c.enableLook = false;

            console.log("[MoveTool] Started moving entity");
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        // Mouse move to update position
        this.handler.setInputAction((movement) => {
            if (!this.active || !this.moving) return;

            const selected = this.selection.getSelected();
            if (!selected) return;

            const newPosition = this.calculateNewPosition(selected, movement.endPosition);
            if (newPosition) {
                selected.position = newPosition;
                this.updateGizmoPosition(newPosition); // Update gizmo position while moving
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // Mouse up to finish moving
        this.handler.setInputAction(async () => {
            if (!this.active || !this.moving) return;

            this.moving = false;

            // Re-enable camera controls after moving
            const c = this.viewer.scene.screenSpaceCameraController;
            c.enableRotate = true;
            c.enableTranslate = true;
            c.enableZoom = true;
            c.enableTilt = true;
            c.enableLook = true;

            const selected = this.selection.getSelected();
            if (selected) {
                await this.persistPosition(selected);
            }

            console.log("[MoveTool] Finished moving entity");
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    removeHandlers() {
        // Remove all input actions to prevent interference with selection
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    activate() {
        console.log("[MoveTool] Activated");
        this.active = true;
        this.setupHandlers(); // Enable handlers when tool is activated
        this.showGizmo();
    }

    deactivate() {
        console.log("[MoveTool] Deactivated");
        this.active = false;
        this.clearDrag();
        this.moving = false;
        this.removeHandlers(); // Disable handlers when tool is deactivated
        this.clearGizmo();
    }

    calculateNewPosition(entity, mousePosition) {
        if (!mousePosition) return null;

        const ray = this.viewer.camera.getPickRay(mousePosition);
        if (!ray) return null;

        // Get the current position of the entity to determine the height to maintain
        const currentPosition = entity.position.getValue(Cesium.JulianDate.now());
        const currentCartographic = Cesium.Cartographic.fromCartesian(currentPosition);
        if (!currentCartographic) return null;

        // Pick the position on the globe at the mouse position
        const pickedPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        if (!pickedPosition) return null;

        // Convert the picked position to cartographic to get longitude and latitude
        const pickedCartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
        if (!pickedCartographic) return null;

        // Create a new position with the picked longitude/latitude but maintaining the original height
        return Cesium.Cartesian3.fromRadians(
            pickedCartographic.longitude,
            pickedCartographic.latitude,
            currentCartographic.height
        );
    }

    updateGizmoPosition(newPosition) {
        // Clear current gizmo
        this.clearGizmo();

        // Create new gizmo at the new position
        this.createGizmoAtPosition(newPosition);
    }

    /**
     * Create gizmo: axes as polylines + cones for heads
     * Uses object-space axes (aligned with entity's rotation)
     */
    showGizmo() {
        this.clearGizmo();

        const selected = this.selection.getSelected();
        if (!selected) return;

        const pos = selected.position.getValue(Cesium.JulianDate.now());
        if (!pos) return;

        // Get entity's rotation/orientation to align axes with object
        let rotation = 0;
        if (selected.properties?.rotation) {
            rotation = selected.properties.rotation.getValue() || 0;
        }

        // Convert rotation to quaternion for proper axis alignment
        const quaternion = Cesium.Quaternion.fromAxisAngle(
            new Cesium.Cartesian3(0, 0, 1),
            rotation
        );

        // Local axis vectors (object-space)
        const localAxes = [
            { 
                name: "x", 
                color: Cesium.Color.RED, 
                localVector: new Cesium.Cartesian3(1, 0, 0),
                worldVector: [this.GIZMO_SCALE, 0, 0]
            },
            { 
                name: "y", 
                color: Cesium.Color.GREEN, 
                localVector: new Cesium.Cartesian3(0, 1, 0),
                worldVector: [0, this.GIZMO_SCALE, 0]
            },
            { 
                name: "z", 
                color: Cesium.Color.BLUE, 
                localVector: new Cesium.Cartesian3(0, 0, 1),
                worldVector: [0, 0, this.GIZMO_SCALE]
            },
        ];

        localAxes.forEach(({ name, color, localVector }) => {
            // Rotate local axis by entity's rotation using matrix
            const rotationMatrix = Cesium.Matrix3.fromQuaternion(quaternion);
            const rotatedVector = Cesium.Matrix3.multiplyByVector(
                rotationMatrix,
                localVector,
                new Cesium.Cartesian3()
            );
            
            // Scale the rotated vector
            Cesium.Cartesian3.multiplyByScalar(
                rotatedVector,
                this.GIZMO_SCALE,
                rotatedVector
            );

            // End position of axis
            const endPos = Cesium.Cartesian3.add(
                pos,
                rotatedVector,
                new Cesium.Cartesian3()
            );

            // Create axis line and pick helper using visualizer
            const { axisLine, pickHelper } = GizmoVisualizer.createGizmoAxis(
                this.viewer,
                pos,
                endPos,
                color,
                name
            );

            axisLine.localVector = localVector;
            axisLine.rotatedVector = rotatedVector;
            pickHelper.localVector = localVector;
            pickHelper.rotatedVector = rotatedVector;

            this.gizmoEntities.push(axisLine);
            this.gizmoEntities.push(pickHelper);

            // Create cone arrowhead
            const conePosition = Cesium.Cartesian3.lerp(
                pos,
                endPos,
                0.85,
                new Cesium.Cartesian3()
            );

            const cone = GizmoVisualizer.createConeArrowhead(
                this.viewer,
                conePosition,
                color,
                name
            );

            this.gizmoEntities.push(cone);
        });

        console.log("[MoveTool] Gizmo created with", this.gizmoEntities.length, "entities (object-space)");
    }

    clearGizmo() {
        this.gizmoEntities.forEach((e) => {
            try {
                this.viewer.entities.remove(e);
            } catch (err) {
                console.warn("[MoveTool] Error removing gizmo entity:", err);
            }
        });
        this.gizmoEntities = [];
    }

    /**
     * Mouse down: detect if clicking a gizmo axis
     */
    onMouseDown(movement) {
        if (!this.active) return;

        const pickedAxis = this.getPickedAxis(movement.position);
        if (!pickedAxis) return;

        // Gizmo was clicked - this click is consumed by the tool
        console.log("[MoveTool] Drag started on axis:", pickedAxis);

        const selected = this.selection.getSelected();
        if (!selected) return;

        this.isDragging = true;
        this.activeAxis = pickedAxis;
        this.dragStartPosition = movement.position;
        this.dragStartEntityPosition = selected.position.getValue(Cesium.JulianDate.now());

        // Lock camera during drag
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
        this.viewer.scene.screenSpaceCameraController.enableZoom = false;
        this.viewer.scene.screenSpaceCameraController.enablePan = false;

        // Visual feedback: highlight the active axis
        const axisLine = this.gizmoEntities.find(
            (e) => e.isAxisLine && e.axis === pickedAxis
        );
        if (axisLine) {
            GizmoVisualizer.highlightAxis(axisLine);
        }
    }

    /**
     * Mouse move: update entity position while dragging (object-space)
     */
    onMouseMove(movement) {
        if (!this.isDragging || !this.activeAxis) return;

        const selected = this.selection.getSelected();
        if (!selected) return;

        // Get entity's rotation
        let rotation = 0;
        if (selected.properties?.rotation) {
            rotation = selected.properties.rotation.getValue() || 0;
        }

        // Create rotation quaternion
        const quaternion = Cesium.Quaternion.fromAxisAngle(
            new Cesium.Cartesian3(0, 0, 1),
            rotation
        );

        // Get local axis vector for this axis
        const localAxisVector = this.getLocalAxisVector(this.activeAxis);

        // Rotate it to world space
        const rotationMatrix = Cesium.Matrix3.fromQuaternion(quaternion);
        const worldAxisVector = Cesium.Matrix3.multiplyByVector(
            rotationMatrix,
            localAxisVector,
            new Cesium.Cartesian3()
        );

        // Convert screen movement to world space movement along rotated axis
        const worldDelta = this.screenToWorldDelta(
            this.dragStartPosition,
            movement.endPosition,
            this.dragStartEntityPosition,
            worldAxisVector
        );

        // Apply axis-locked movement
        let newPosition = Cesium.Cartesian3.add(
            this.dragStartEntityPosition,
            worldDelta,
            new Cesium.Cartesian3()
        );

        // Ground constraint: keep on ground for horizontal movement
        if (this.activeAxis !== 'z') {
            // For X/Y movement, constrain to ground level (keep original Z)
            const startCartographic = Cesium.Cartographic.fromCartesian(this.dragStartEntityPosition);
            const newCartographic = Cesium.Cartographic.fromCartesian(newPosition);
            newCartographic.height = startCartographic.height;
            newPosition = Cesium.Cartographic.toCartesian(newCartographic);
        }

        // Update entity position
        selected.position = newPosition;

        // Update gizmo position
        this.updateGizmoPosition(newPosition);

        console.log("[MoveTool] Moving on object axis", this.activeAxis, "offset:", worldDelta);
    }

    /**
     * Mouse up: commit final position and sync to backend
     */
    async onMouseUp(movement) {
        if (!this.isDragging) return;

        const selected = this.selection.getSelected();
        if (!selected) return;

        // Unlock camera
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        this.viewer.scene.screenSpaceCameraController.enableZoom = true;
        this.viewer.scene.screenSpaceCameraController.enablePan = true;

        const finalPos = selected.position.getValue(Cesium.JulianDate.now());

        console.log("[MoveTool] Drag ended. Final position:", finalPos);

        // Sync to backend
        await this.syncToBackend(selected, finalPos);

        this.clearDrag();
    }

    /**
     * Sync position change to backend JSON via StructureService
     */
    async syncToBackend(entity, finalPos) {
        try {
            // Convert Cartesian3 to lat/lon
            const cartographic = Cesium.Cartographic.fromCartesian(finalPos);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);

            console.log("[MoveTool] Syncing to backend:", entity.id, { lat, lon });

            // Update via StructureService
            const result = await StructureService.update(entity.id, {
                id: entity.id,
                position: [lon, lat] // API expects [lon, lat]
            });

            console.log("[MoveTool] Backend sync successful!");
        } catch (err) {
            console.error("[MoveTool] Backend sync failed:", err);
            // Rollback to previous position on error
            selected.position = this.dragStartEntityPosition;
            this.updateGizmoPosition(this.dragStartEntityPosition);
        }
    }

    /**
     * Clear drag state
     */
    clearDrag() {
        // Visual feedback: unhighlight the axis
        if (this.activeAxis) {
            const axisLine = this.gizmoEntities.find(
                (e) => e.isAxisLine && e.axis === this.activeAxis
            );
            if (axisLine) {
                GizmoVisualizer.unhighlightAxis(axisLine);
            }
        }

        this.isDragging = false;
        this.activeAxis = null;
        this.dragStartPosition = null;
        this.dragStartEntityPosition = null;
    }

    /**
     * Update gizmo position to follow entity (uses object-space axes)
     */
    updateGizmoPosition(entityPos) {
        const selected = this.selection.getSelected();
        if (!selected) return;

        // Get current rotation
        let rotation = 0;
        if (selected.properties?.rotation) {
            rotation = selected.properties.rotation.getValue() || 0;
        }

        const quaternion = Cesium.Quaternion.fromAxisAngle(
            new Cesium.Cartesian3(0, 0, 1),
            rotation
        );

        const axes = [
            { 
                name: "x", 
                localVector: new Cesium.Cartesian3(1, 0, 0)
            },
            { 
                name: "y", 
                localVector: new Cesium.Cartesian3(0, 1, 0)
            },
            { 
                name: "z", 
                localVector: new Cesium.Cartesian3(0, 0, 1)
            },
        ];

        axes.forEach(({ name, localVector }) => {
            // Rotate local axis by entity's rotation
            const rotationMatrix = Cesium.Matrix3.fromQuaternion(quaternion);
            const rotatedVector = Cesium.Matrix3.multiplyByVector(
                rotationMatrix,
                localVector,
                new Cesium.Cartesian3()
            );
            Cesium.Cartesian3.multiplyByScalar(
                rotatedVector,
                this.GIZMO_SCALE,
                rotatedVector
            );

            const endPos = Cesium.Cartesian3.add(
                entityPos,
                rotatedVector,
                new Cesium.Cartesian3()
            );

            // Update axis line
            const axisLine = this.gizmoEntities.find(
                (e) => e.isAxisLine && e.axis === name
            );
            if (axisLine) {
                axisLine.polyline.positions = [entityPos, endPos];
            }

            // Update pick helper
            const pickHelper = this.gizmoEntities.find(
                (e) => e.isPickHelper && e.axis === name
            );
            if (pickHelper) {
                pickHelper.polyline.positions = [entityPos, endPos];
            }

            // Update cone
            const cone = this.gizmoEntities.find((e) => e.isCone && e.axis === name);
            if (cone) {
                cone.position = Cesium.Cartesian3.lerp(
                    entityPos,
                    endPos,
                    0.85,
                    new Cesium.Cartesian3()
                );
            }
        });
    }

    /**
     * Pick axis at screen position using drillPick for reliability
     */
    getPickedAxis(screenPos) {
        const picks = this.viewer.scene.drillPick(screenPos);
        if (!picks || picks.length === 0) return null;

        // Find first gizmo entity with an axis
        const picked = picks.find((p) => p.id && p.id.isGizmo && p.id.axis);
        return picked ? picked.id.axis : null;
    }

    /**
     * Convert screen-space movement to world-space movement along the active axis
     * Uses plane intersection to ensure consistent axis-locked movement
     * Now accepts world-space axis vector (from object-space rotation)
     */
    screenToWorldDelta(startScreenPos, endScreenPos, entityWorldPos, axisVector) {
        const camera = this.viewer.camera;

        // Get rays from camera through screen positions
        const startRay = camera.getPickRay(startScreenPos);
        const endRay = camera.getPickRay(endScreenPos);

        if (!startRay || !endRay) {
            return new Cesium.Cartesian3(0, 0, 0);
        }

        // Create a plane perpendicular to the axis, passing through entity position
        // This ensures movement is constrained to the axis
        const perpendicular = this.getPerpendiculartToAxis(axisVector);
        const plane = Cesium.Plane.fromPointNormal(
            entityWorldPos,
            perpendicular
        );

        // Find where the rays intersect the plane
        const startIntersection = this.rayPlaneIntersection(startRay, plane);
        const endIntersection = this.rayPlaneIntersection(endRay, plane);

        if (!startIntersection || !endIntersection) {
            // Fallback: simple axis projection
            return this.projectMovementOntoAxis(startRay, endRay, axisVector);
        }

        // Calculate movement vector
        const delta = Cesium.Cartesian3.subtract(
            endIntersection,
            startIntersection,
            new Cesium.Cartesian3()
        );

        // Project onto axis to ensure pure axis movement
        return this.projectVectorOntoAxis(delta, axisVector);
    }

    /**
     * Get a vector perpendicular to the axis (for plane calculation)
     */
    getPerpendiculartToAxis(axisVector) {
        const normalized = Cesium.Cartesian3.normalize(axisVector, new Cesium.Cartesian3());

        // Find a vector not parallel to the axis
        let perpendicular;
        if (Math.abs(normalized.x) < 0.9) {
            perpendicular = Cesium.Cartesian3.cross(
                normalized,
                new Cesium.Cartesian3(1, 0, 0),
                new Cesium.Cartesian3()
            );
        } else {
            perpendicular = Cesium.Cartesian3.cross(
                normalized,
                new Cesium.Cartesian3(0, 1, 0),
                new Cesium.Cartesian3()
            );
        }

        return Cesium.Cartesian3.normalize(perpendicular, perpendicular);
    }

    /**
     * Find ray-plane intersection point
     */
    rayPlaneIntersection(ray, plane) {
        const direction = ray.direction;
        const origin = ray.origin;
        const normal = plane.normal;
        const distance = plane.distance;

        const denom = Cesium.Cartesian3.dot(normal, direction);
        if (Math.abs(denom) < 1e-6) return null; // Ray parallel to plane

        const t =
            -(Cesium.Cartesian3.dot(normal, origin) + distance) / denom;
        if (t < 0) return null; // Plane is behind ray

        return Cesium.Cartesian3.add(
            origin,
            Cesium.Cartesian3.multiplyByScalar(direction, t, new Cesium.Cartesian3()),
            new Cesium.Cartesian3()
        );
    }

    /**
     * Project a movement vector onto an axis
     */
    projectMovementOntoAxis(startRay, endRay, axisVector) {
        // Sample two points along each ray
        const startP1 = Cesium.Ray.getPoint(startRay, 50);
        const startP2 = Cesium.Ray.getPoint(startRay, 100);
        const endP1 = Cesium.Ray.getPoint(endRay, 50);
        const endP2 = Cesium.Ray.getPoint(endRay, 100);

        const movement = Cesium.Cartesian3.subtract(
            endP1,
            startP1,
            new Cesium.Cartesian3()
        );

        return this.projectVectorOntoAxis(movement, axisVector);
    }

    /**
     * Project vector onto axis and return result
     */
    projectVectorOntoAxis(vector, axis) {
        const dot = Cesium.Cartesian3.dot(vector, axis);
        return Cesium.Cartesian3.multiplyByScalar(
            axis,
            dot,
            new Cesium.Cartesian3()
        );
    }

    /**
     * Get local axis vector for object-space (before rotation)
     */
    getLocalAxisVector(axis) {
        switch (axis) {
            case "x":
                return new Cesium.Cartesian3(1, 0, 0);
            case "y":
                return new Cesium.Cartesian3(0, 1, 0);
            case "z":
                return new Cesium.Cartesian3(0, 0, 1);
            default:
                return new Cesium.Cartesian3(0, 0, 0);
        }
    }

    /**
     * Get unit vector for axis (legacy, kept for compatibility)
     */
    getAxisVector(axis) {
        switch (axis) {
            case "x":
                return new Cesium.Cartesian3(1, 0, 0);
            case "y":
                return new Cesium.Cartesian3(0, 1, 0);
            case "z":
                return new Cesium.Cartesian3(0, 0, 1);
            default:
                return new Cesium.Cartesian3(0, 0, 0);
        }
    }

    /**
     * Check if tool consumed a click at this position
     * Used by EditorSelection to prevent selection on gizmo clicks
     */
    handlesClick(position) {
        if (!this.active) return false;

        const pickedAxis = this.getPickedAxis(position);
        return pickedAxis !== null;
    }

    async persistPosition(entity) {
        try {
            const newPosition = entity.position.getValue(Cesium.JulianDate.now());

            // Convert Cartesian3 to longitude, latitude, height
            const cartographic = Cesium.Cartographic.fromCartesian(newPosition);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const height = cartographic.height;

            // Check if it's a camera or structure and update accordingly
            if (entity.model) {
                // It's a camera entity (using Cesium Man model)
                // Send position as [longitude, latitude, height] array
                const positionArray = [lon, lat, height];

                // Get the current rotation if it exists
                let currentRotation = 0;
                if (entity.properties && entity.properties.rotation) {
                    const rotation = entity.properties.rotation.getValue ?
                        entity.properties.rotation.getValue() :
                        entity.properties.rotation;
                    currentRotation = rotation;
                }

                await CameraService.update(entity.id, {
                    position: positionArray,
                    height: height,  // Send height separately as the backend expects it
                    rotation: currentRotation  // Preserve the current rotation
                });
                console.log("[MoveTool] Camera position saved");

                // Update the stored camera data in CameraDrawer to reflect the new position
                if (this.viewer.cameraDrawer && typeof this.viewer.cameraDrawer.updateStoredCameraData === 'function') {
                    this.viewer.cameraDrawer.updateStoredCameraData(entity.id);
                }
            } else if (entity.box) {
                // It's a structure entity
                await StructureService.update(entity.id, {
                    position: [lon, lat]
                });
                console.log("[MoveTool] Structure position saved");
            }
        } catch (err) {
            console.error("Failed to persist position:", err);
        }
    }
}
