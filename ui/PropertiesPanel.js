// PropertiesPanel.js
import { StructureService } from "../../services/StructureService.js";


export class PropertiesPanel {
    constructor(editorSelection) {
        this.selection = editorSelection;

        this.elEmpty = document.getElementById("prop-empty");
        this.elForm = document.getElementById("prop-form");
        this.elType = document.getElementById("prop-type");
        this.elColor = document.getElementById("prop-color");

        this.currentEntity = null;
        this.isSyncing = false;
        this.saveTimer = null;


        // Listen to selection changes
        this.selection.onChange((entity) => this.onSelectionChanged(entity));

        // UI -> entity updates
        this.elType.addEventListener("change", () => this.applyEdits());
        this.elColor.addEventListener("input", () => this.applyEdits());
    }

    onSelectionChanged(entity) {
        this.currentEntity = entity;

        if (!entity) {
            this.elEmpty.style.display = "block";
            this.elForm.style.display = "none";
            return;
        }

        // Only show for entities that have a PropertyBag / properties
        if (!entity.properties) {
            this.elEmpty.style.display = "block";
            this.elForm.style.display = "none";
            return;
        }

        this.elEmpty.style.display = "none";
        this.elForm.style.display = "block";

        // Fill form from entity
        this.isSyncing = true;
        const type = getProp(entity, "type") ?? "building";
        const color = getProp(entity, "color") ?? "#ffffff";

        this.elType.value = type;
        this.elColor.value = normalizeHex(color);
        this.isSyncing = false;
    }

    applyEdits() {
        if (this.isSyncing) return;
        if (!this.currentEntity) return;

        const entity = this.currentEntity;

        // Update entity properties (data)
        setProp(entity, "type", this.elType.value);
        setProp(entity, "color", this.elColor.value);

        // Update visuals (for now: just box color)
        if (entity.box) {
            entity.box.material = Cesium.Color.fromCssColorString(this.elColor.value);
        }

        console.log("[PropertiesPanel] Updated entity", entity.id, {
            type: this.elType.value,
            color: this.elColor.value,
        });

        this.queueSave();

    }

    queueSave() {
        if (!this.currentEntity) return;

        // Debounce
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.saveNow(), 250);
    }

    async saveNow() {
        if (!this.currentEntity) return;

        const id = this.currentEntity.id;

        const payload = {
            type: this.elType.value,
            style: { color: this.elColor.value }
        };

        try {
            const updated = await StructureService.update(id, payload);
            console.log("[PropertiesPanel] Saved to backend:", id, updated);
        } catch (err) {
            console.error("[PropertiesPanel] Failed to save structure:", id, err);
        }
    }

}

// Helpers for Cesium PropertyBag values (ConstantProperty vs raw)
function getProp(entity, key) {
    if (!entity.properties || !entity.properties[key]) return null;
    const prop = entity.properties[key];
    // ConstantProperty has getValue
    if (typeof prop.getValue === "function") {
        return prop.getValue(Cesium.JulianDate.now());
    }
    return prop;
}

function setProp(entity, key, value) {
    // If it's a PropertyBag, assigning will typically wrap into ConstantProperty
    entity.properties[key] = value;
}

function normalizeHex(value) {
    // In case you ever store lowercase/uppercase or missing "#"
    if (!value) return "#ffffff";
    if (value[0] !== "#") return "#" + value;
    return value;
}


