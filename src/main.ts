import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import * as L from 'leaflet';

// Leaflet's default marker icons use relative paths that break in bundled builds.
// Patch the prototype once here so every L.marker() call gets the correct CDN URLs.
const LEAFLET_VERSION = '1.9.4';
L.Marker.prototype.options.icon = L.icon({
  iconUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon.png`,
  iconRetinaUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon-2x.png`,
  shadowUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
