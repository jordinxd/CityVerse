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
        // If there's a current tool, turn it off
        if (this.activeTool && this.tools[this.activeTool]) {
            this.tools[this.activeTool].deactivate();
        }

        // Register new tool
        this.activeTool = name;

        // If something is selected, show the gizmo
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
}
