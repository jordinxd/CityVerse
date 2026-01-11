/**
 * GizmoVisualizer: Helper class for gizmo visual feedback
 * Provides methods to highlight and unhighlight gizmo axes
 */
export class GizmoVisualizer {
    static createGizmoAxis(viewer, startPos, endPos, color, axis) {
        // Visible axis line
        const axisLine = viewer.entities.add({
            polyline: {
                positions: [startPos, endPos],
                width: 6,
                material: color,
                clampToGround: false,
                zIndex: 100
            }
        });
        axisLine.isGizmo = true;
        axisLine.axis = axis;
        axisLine.isAxisLine = true;
        axisLine.originalColor = color;

        // Invisible, wider polyline for easier picking
        const pickHelper = viewer.entities.add({
            polyline: {
                positions: [startPos, endPos],
                width: 15,
                material: new Cesium.Color(0, 0, 0, 0),
                clampToGround: false,
                zIndex: 99
            }
        });
        pickHelper.isGizmo = true;
        pickHelper.axis = axis;
        pickHelper.isPickHelper = true;

        return { axisLine, pickHelper };
    }

    static highlightAxis(axisLineEntity) {
        if (!axisLineEntity || !axisLineEntity.polyline) return;

        const originalColor = axisLineEntity.originalColor || axisLineEntity.polyline.material;
        const brightColor = new Cesium.Color(
            Math.min(originalColor.red + 0.3, 1),
            Math.min(originalColor.green + 0.3, 1),
            Math.min(originalColor.blue + 0.3, 1),
            originalColor.alpha
        );

        axisLineEntity.polyline.width = new Cesium.CallbackProperty(() => 10, false);
        axisLineEntity.polyline.material = brightColor;
    }

    static unhighlightAxis(axisLineEntity) {
        if (!axisLineEntity || !axisLineEntity.polyline) return;

        const originalColor = axisLineEntity.originalColor || Cesium.Color.WHITE;
        axisLineEntity.polyline.width = new Cesium.CallbackProperty(() => 6, false);
        axisLineEntity.polyline.material = originalColor;
    }

    static createConeArrowhead(viewer, position, color, axis) {
        // Create arrowhead cone using cylinder primitive
        const cone = viewer.entities.add({
            position: position,
            cylinder: {
                length: 2,
                topRadius: 0,
                bottomRadius: 1,
                material: color,
                outline: false
            }
        });
        cone.isGizmo = true;
        cone.axis = axis;
        cone.isCone = true;

        return cone;
    }
}
