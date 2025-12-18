export function createViewer() {
    const west = 5.798212900532118;
    const south = 53.19304584690279;
    const east = 5.798212900532118;
    const north = 53.19304584690279;

    Cesium.Camera.DEFAULT_VIEW_FACTOR = 0.0005;
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
        west, south, east, north
    );

    const osm = new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
    });

    const viewer = new Cesium.Viewer("cesiumContainer", {
        baseLayerPicker: false,
        imageryProvider: false,
        infoBox: false,
        selectionIndicator: false,
        shadows: true,
        shouldAnimate: true,

        // Disable base UI components
        geocoder: false,         
        homeButton: false,          
        sceneModePicker: false,
        navigationHelpButton: false,
        BaseLayerPicker: false, 
        animation: false,
        timeline: false
    });

    viewer.scene.primitives.destroyPrimitives = false;
    viewer.scene.primitives.add(new Cesium.LabelCollection());
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(osm);

    viewer.scene.globe.maximumScreenSpaceError = 1;

    return viewer;
}
