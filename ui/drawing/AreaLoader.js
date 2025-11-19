import { AreaService } from "../../services/AreaService.js";

export async function loadAreas(viewer) {
    const areas = await AreaService.getAll();

    areas.forEach(area => {
        const style = area.style ?? {};

        const fillColor = Cesium.Color
            .fromCssColorString(style.fillColor ?? "#1E90FF")
            .withAlpha(style.fillOpacity ?? 0.25);

        const outlineColor = Cesium.Color
            .fromCssColorString(style.outlineColor ?? "#0044AA");

        const heightOffset = style.heightOffset ?? 0;

        viewer.entities.add({
            name: area.name,
            polygon: {
                hierarchy: area.polygon.map(p =>
                    Cesium.Cartesian3.fromDegrees(
                        p[0],
                        p[1],
                        heightOffset
                    )
                ),

                perPositionHeight: true,
                material: fillColor,
                outline: true,
                outlineColor,
                outlineWidth: style.outlineWidth ?? 2
            }
        });
    });
}


