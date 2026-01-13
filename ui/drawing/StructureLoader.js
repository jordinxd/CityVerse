import { StructureService } from "../../services/StructureService.js";

export async function loadStructures(viewer) {
    const list = await StructureService.getAll();

    list.forEach(s => {
        viewer.entities.add({
            id: s.id,
            position: Cesium.Cartesian3.fromDegrees(
                s.position[0],
                s.position[1],
                s.height / 2
            ),
            orientation: Cesium.Transforms.headingPitchRollQuaternion(
                Cesium.Cartesian3.fromDegrees(s.position[0], s.position[1]),
                new Cesium.HeadingPitchRoll(
                    Cesium.Math.toRadians(s.rotation ?? 0),
                    0,
                    0
                )
            ),
            properties: new Cesium.PropertyBag({
                rotation: s.rotation ?? 0
            }),
            box: {
                dimensions: new Cesium.Cartesian3(
                    s.width,
                    s.depth,
                    s.height
                ),
                material: Cesium.Color.fromCssColorString(s.style.color)
            }
        });
    });
}
