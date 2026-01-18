import { StructureService } from "../../services/StructureService.js";
import { applyStructureToEntity } from "./StructureEntityBinder.js";


export async function loadStructures(viewer) {
  const list = await StructureService.getAll();

  // Check if structures data is valid
  if (!list || !Array.isArray(list)) {
    console.warn("[StructureLoader] No structures data received from backend. Skipping structure loading.");
    return;
  }

  list.forEach(s => {
    const entity = viewer.entities.add({ id: s.id });
    applyStructureToEntity(entity, s);
  });
}
