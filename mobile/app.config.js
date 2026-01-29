import "dotenv/config";
export default {
  "expo": {
    "name": "mobile",
    "slug": "mobile",
    "version": "1.0.0",
    "extra": {
      API_URL: process.env.API_URL,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    },
    "orientation": "portrait",
    // "icon": "./assets/images/icon.png",
    "scheme": "mobile",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": true
        }
      }
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "usesCleartextTraffic": true
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      "expo-font"
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
