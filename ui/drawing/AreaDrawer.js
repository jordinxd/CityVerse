import { AreaService } from "../../services/AreaService.js";

export class AreaDrawer {
    constructor(viewer) {
        this.viewer = viewer;
        this.isDrawing = false;
        this.positions = []; // {lat, lon}
        this.entity = null;

        this.leftClickHandler = null;
        this.initDrawingEntity();
    }

    // Dynamic polygon entity
    initDrawingEntity() {
        this.entity = this.viewer.entities.add({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    if (!this.isDrawing || this.positions.length < 3) return null;

                    return new Cesium.PolygonHierarchy(
                        this.positions.map((p) =>
                            Cesium.Cartesian3.fromDegrees(p.lon, p.lat)
                        )
                    );
                }, false),
                material: Cesium.Color.YELLOW.withAlpha(0.4),
                outline: true,
                outlineColor: Cesium.Color.BLACK,
                perPositionHeight: true,
            },
        });
    }

    start() {
        this.isDrawing = true;
        this.positions = [];

        console.log("Area drawing started");

        // Setup handler only once
        if (!this.leftClickHandler) {
            this.leftClickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

            this.leftClickHandler.setInputAction((event) => {
                if (!this.isDrawing) return;

                let earthPos = this.viewer.scene.pickPosition(event.position);

            if (!Cesium.defined(earthPos)) {
                // fallback: pick on globe
                earthPos = this.viewer.scene.globe.pick(
                    this.viewer.camera.getPickRay(event.position),
                    this.viewer.scene
                );
            }

            if (!Cesium.defined(earthPos)) return;

                const carto = Cesium.Cartographic.fromCartesian(earthPos);

                const lat = Cesium.Math.toDegrees(carto.latitude);
                const lon = Cesium.Math.toDegrees(carto.longitude);
                this.positions.push({ lat, lon });
                console.log("AreaDrawer: added point", { lat, lon }, "total:", this.positions.length);
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
    }

    async finish(name) {
        console.log("AreaDrawer.finish called", { isDrawing: this.isDrawing, positionsLength: this.positions.length, positions: this.positions });
        if (!this.isDrawing || this.positions.length < 3) {
            alert("You need at least 3 points for an area.");
            return;
        }

        this.isDrawing = false;

        // Construct area object
        const area = {
    id: name.toLowerCase().replace(/\s+/g, "_"),
    name,
    polygon: this.positions.map(p => [p.lon, p.lat]),
    allowedTypes: ["building", "road", "green"],
    style: {
        fillColor: "#00AEEF",       // light blue
        fillOpacity: 0.25,
        outlineColor: "#003F7F",
        outlineWidth: 2,
        heightOffset: 0.1,
    }
};


        // Save to backend
        const created = await AreaService.create(area);
        console.log("Area saved:", created);

        // Add a permanent visual for the saved area so it remains visible
        // immediately (the dynamic drawing entity clears when positions reset).
        try {
            const style = area.style ?? {};
            const fillColor = Cesium.Color
            .fromCssColorString(style.fillColor ?? "#1E90FF")
            .withAlpha(style.fillOpacity ?? 0.25);

        const outlineColor = Cesium.Color
            .fromCssColorString(style.outlineColor ?? "#0044AA");

        const heightOffset = style.heightOffset ?? 0;

        this.viewer.entities.add({
            id: area.id,
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
        } catch (e) {
            console.error("Failed to spawn visual for area:", e);
        }

        // Reset drawing state
        this.positions = [];
        this.isDrawing = false;
    }

    cancel() {
        this.isDrawing = false;
        this.positions = [];
        console.log("Area drawing cancelled");
    }
}
