// jest.setup.js

// Mock Cesium globally
global.Cesium = {
  Cartesian3: {
    fromRadians: jest.fn((lon, lat, height) => ({ x: lon, y: lat, z: height })),
    fromDegrees: jest.fn((lon, lat, height) => ({ x: lon, y: lat, z: height })),
    fromCartesian: jest.fn((cart) => cart || { x: 0, y: 0, z: 0 }),
  },
  Cartographic: {
    fromCartesian: jest.fn((cart) => {
      // Convert back from the mock Cartesian3
      if (cart && typeof cart.x === 'number' && typeof cart.y === 'number' && typeof cart.z === 'number') {
        return {
          longitude: cart.x * Math.PI / 180, // Convert back to radians
          latitude: cart.y * Math.PI / 180,
          height: cart.z
        };
      }
      return { longitude: 0, latitude: 0, height: 0 };
    }),
  },
  Math: {
    toDegrees: jest.fn((rad) => rad * (180 / Math.PI)),
    toRadians: jest.fn((deg) => deg * (Math.PI / 180)),
  },
  JulianDate: {
    now: jest.fn(() => new Date()),
  },
  ScreenSpaceEventHandler: jest.fn(() => ({
    setInputAction: jest.fn(),
    removeInputAction: jest.fn(),
  })),
  ScreenSpaceEventType: {
    LEFT_CLICK: 'left_click',
    LEFT_DOWN: 'left_down',
    MOUSE_MOVE: 'mouse_move',
    LEFT_UP: 'left_up',
  },
  Color: {
    RED: { red: 1, green: 0, blue: 0, alpha: 1 },
    GREEN: { red: 0, green: 1, blue: 0, alpha: 1 },
    BLUE: { red: 0, green: 0, blue: 1, alpha: 1 },
  },
  CallbackProperty: jest.fn((callback) => ({ callback })),
  PolylineGraphics: jest.fn(() => ({})),
  ConeGraphics: jest.fn(() => ({})),
  LabelGraphics: jest.fn(() => ({})),
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};