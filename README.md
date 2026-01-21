# Delhi Camera

A camera app that shows you what your surroundings would look like under Delhi's air quality.

Select amongst a few Indian cities including Delhi, and the app overlays realistic volumetric smog
on your live camera feed based on real-time AQI data.

## DEMO

| ![demo1](./assets/demo1.gif) | ![demo2](./assets/demo2.gif) |
| ---------------------------- | ---------------------------- |

## How It Works

1. Fetches live AQI data for Indian cities
2. Captures your camera feed as a WebGL texture
3. Applies a custom GLSL shader that simulates atmospheric haze:
   - Height-based density gradient (thinner at the bottom and thicker at horizon)
   - Animated multi-layer noise for organic movement
   - Color desaturation and contrast reduction
4. AQI value controls smog intensity

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `yarn install`
2. Set up .env variables
3. Run the app: `yarn run dev`
