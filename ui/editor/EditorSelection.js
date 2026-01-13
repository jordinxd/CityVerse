export class EditorSelection {
    constructor(viewer) {
        this.viewer = viewer;
        this.selected = null;
        this.callbacks = [];

        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        // this.handler.setInputAction((movement) => {
        //     const picked = viewer.scene.pick(movement.position);

        //     let newSelection = null;

        //     if (picked && picked.id && picked.id.properties) {
        //         newSelection = picked.id;
        //     }

        //     if (newSelection !== this.selected) {
        //         this.selected = newSelection;
        //         this.emitChange();
        //     }

        // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction((movement) => {
    const picked = viewer.scene.pick(movement.position);

    console.log("[Selection] Picked:", picked);

    let newSelection = null;

    if (picked && picked.id) {
        console.log("[Selection] Picked entity ID:", picked.id.id);
        console.log("[Selection] Properties:", picked.id.properties);
    }

    if (picked && picked.id && picked.id.properties) {
        newSelection = picked.id;
    }

    if (newSelection !== this.selected) {
        console.log("[Selection] Selection changed:", newSelection?.id);
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
