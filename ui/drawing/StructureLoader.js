import { StructureService } from "../../services/StructureService.js";
import { applyStructureToEntity } from "./StructureEntityBinder.js";


export async function loadStructures(viewer) {
  const list = await StructureService.getAll();

  list.forEach(s => {
    const entity = viewer.entities.add({ id: s.id });
    applyStructureToEntity(entity, s);
  });
}
