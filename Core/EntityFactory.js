import { latlonFromXY } from "./CoordinateUtils.js";

let boxCount = 1;
let polygonCount = 1;

export function createBox(viewer, x, y, width, depth, height, rotation, color) {
    const c = latlonFromXY(x, y);

    return viewer.entities.add({
        name: "Box_" + boxCount++,
        position: Cesium.Cartesian3.fromDegrees(c.lat, c.lon, height / 2.0),
        box: {
            dimensions: new Cesium.Cartesian3(width, depth, height),
            material: color
        }
    });
}

export function moveEntity(entity, x, y) {
    const c = latlonFromXY(x, y);
    entity.position = Cesium.Cartesian3.fromDegrees(
        c.lat,
        c.lon,
        entity.box.dimensions._value.z
    );
}

export function createPolygonFromXYs(viewer, xyArray, color) {
    let degreeArray = [];
    xyArray.forEach(element => {
        const c = latlonFromXY(element[0], element[1]);
        degreeArray.push(c.lat);
        degreeArray.push(c.lon);
    });

    return viewer.entities.add({
        name: "Polygon_" + polygonCount++,
        polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(degreeArray),
            material: color,
        },
    });
}

export function createModel(viewer, url, position, height) {
    const full_position = Cesium.Cartesian3.fromDegrees(position.lat, position.lon, height);

    const hpr = new Cesium.HeadingPitchRoll(
        Cesium.Math.toRadians(135),
        0,
        0
    );

    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
        full_position,
        hpr
    );

    const entity = viewer.entities.add({
        name: url,
        position: full_position,
        orientation,
        model: {
            uri: url,
            minimumPixelSize: 128,
            maximumScale: 1,
        },
    });

    return entity;
}
