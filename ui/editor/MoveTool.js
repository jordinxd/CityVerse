export class MoveTool {
    constructor(viewer, selection) {
        this.viewer = viewer;
        this.selection = selection;
        this.gizmoEntities = [];
        this.active = false;
    }

    activate() {
        console.log("Move tool activated");
        this.active = true;
        this.showGizmo();
    }

    deactivate() {
        this.active = false;
        this.clearGizmo();
    }

    showGizmo() {
        this.clearGizmo();

        const selected = this.selection.getSelected();
        if (!selected) return;

        const pos = selected.position.getValue(Cesium.JulianDate.now());

        // RED ARROW (X axis)
        this.gizmoEntities.push(this.viewer.entities.add({
            polyline: {
                positions: [
                    pos,
                    Cesium.Cartesian3.add(pos, new Cesium.Cartesian3(10, 0, 0), new Cesium.Cartesian3())
                ],
                width: 5,
                material: Cesium.Color.RED
            }
        }));

        // GREEN ARROW (Y axis)
        this.gizmoEntities.push(this.viewer.entities.add({
            polyline: {
                positions: [
                    pos,
                    Cesium.Cartesian3.add(pos, new Cesium.Cartesian3(0, 10, 0), new Cesium.Cartesian3())
                ],
                width: 5,
                material: Cesium.Color.GREEN
            }
        }));
    }

    clearGizmo() {
        this.gizmoEntities.forEach(e => this.viewer.entities.remove(e));
        this.gizmoEntities = [];
    }
}
