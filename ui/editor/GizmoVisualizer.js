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
                arcType: Cesium.ArcType.NONE,
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

    static createConeArrowhead(viewer, startPos, endPos, color, axis) {
  // Direction from start -> end
  const dir = Cesium.Cartesian3.subtract(endPos, startPos, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(dir, dir);

  // Build a rotation that points the cylinder's "up" (Z) along dir
  // We'll construct an ENU-like frame where:
  // - forward = dir
  // - right   = forward x worldUp (fallback if parallel)
  const worldUp = Cesium.Cartesian3.UNIT_Z;
  let right = Cesium.Cartesian3.cross(dir, worldUp, new Cesium.Cartesian3());

  // If dir is nearly parallel to worldUp, use UNIT_X as fallback
  if (Cesium.Cartesian3.magnitude(right) < 1e-6) {
    right = Cesium.Cartesian3.cross(dir, Cesium.Cartesian3.UNIT_X, right);
  }
  Cesium.Cartesian3.normalize(right, right);

  const up = Cesium.Cartesian3.cross(right, dir, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(up, up);

  // Matrix3 columns: X=right, Y=up, Z=dir
  const rot = new Cesium.Matrix3(
    right.x, up.x, dir.x,
    right.y, up.y, dir.y,
    right.z, up.z, dir.z
  );

  const orientation = Cesium.Quaternion.fromRotationMatrix(rot);

  // Position cone near the end
  const conePos = Cesium.Cartesian3.lerp(startPos, endPos, 0.9, new Cesium.Cartesian3());

  const cone = viewer.entities.add({
    position: conePos,
    orientation,
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
