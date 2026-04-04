import "dotenv/config";

export default {
  expo: {
    name: "mobile",
    slug: "mobile",
    version: "1.0.0",
    extra: {
      eas: {
        projectId: "ac3814e6-0d11-4a07-87dd-1d5492a916d9"
      },
      API_URL: process.env.API_URL,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    },
    orientation: "portrait",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.wongwiwat.justgo",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.wongwiwat.justgo",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      usesCleartextTraffic: true
    },
    web: {
      output: "static",
    },
    plugins: [
      "expo-router",
      "expo-font"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  }
};