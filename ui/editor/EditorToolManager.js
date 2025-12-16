export class EditorToolManager {
    constructor(viewer, selection, tools) {
        this.viewer = viewer;
        this.selection = selection;
        this.tools = tools;
        this.activeTool = null;

        this.selection.onChange(() => {
            this.onSelectionChanged();
        });
    }

    activateTool(name) {
    // Deactivate current tool
    if (this.activeTool && this.tools[this.activeTool]) {
        this.tools[this.activeTool].deactivate();
    }

    if (!this.tools[name]) {
        console.warn("EditorToolManager: unknown tool:", name);
        this.activeTool = null;
        return;
    }

    this.activeTool = name;

    if (this.selection.getSelected()) {
        this.tools[name].activate();
    }

    console.log("Active editor tool:", name);
}


    onSelectionChanged() {
        const selected = this.selection.getSelected();

        if (!selected) {
            if (this.activeTool) {
                this.tools[this.activeTool].deactivate();
            }
            return;
        }

        // Re-activate gizmo at the new selection
        if (this.activeTool) {
            this.tools[this.activeTool].activate();
        }
    }

    deactivateAll() {
        if (this.activeTool && this.tools[this.activeTool]) {
            this.tools[this.activeTool].deactivate();
            this.activeTool = null;
        }
    }
}
