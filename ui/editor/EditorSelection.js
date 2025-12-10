export class EditorSelection {
    constructor(viewer) {
        this.viewer = viewer;
        this.selected = null;
        this.callbacks = [];

        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        this.handler.setInputAction((movement) => {
            const picked = viewer.scene.pick(movement.position);

            let newSelection = null;

            if (picked && picked.id && picked.id.properties) {
                newSelection = picked.id;
            }

            if (newSelection !== this.selected) {
                this.selected = newSelection;
                this.emitChange();
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    onChange(callback) {
        this.callbacks.push(callback);
    }

    emitChange() {
        this.callbacks.forEach(cb => cb(this.selected));
    }

    getSelected() {
        return this.selected;
    }

    clear() {
        this.selected = null;
        this.emitChange();
    }
}
