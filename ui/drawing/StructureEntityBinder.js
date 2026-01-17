// StructureEntityBinder.js
export function applyStructureToEntity(entity, structure) {
  const [lon, lat] = structure.position;

  // Position (keep height centered)
  entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, (structure.height ?? 0) / 2);

  // Orientation from rotation (degrees)
  const rot = structure.rotation ?? 0;
  entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
    Cesium.Cartesian3.fromDegrees(lon, lat),
    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(rot), 0, 0)
  );

  // Store editable data in properties (single source for UI)
  if (!(entity.properties instanceof Cesium.PropertyBag)) {
    entity.properties = new Cesium.PropertyBag();
  }

  entity.properties.rotation = rot;
  entity.properties.type = structure.type ?? "building";
  entity.properties.color = structure.style?.color ?? "#ffffff";
  entity.properties.kind = "structure";


  // Visuals
  entity.box = entity.box ?? {};
  entity.box.dimensions = new Cesium.Cartesian3(structure.width, structure.depth, structure.height);
  entity.box.material = Cesium.Color.fromCssColorString(entity.properties.color);
}
