
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Point, Category, IsochroneFetchResult } from '../types';
import type * as GeoJSON from 'geojson'; // Import GeoJSON namespace
import { KRAKOW_CENTER_LATLNG, INITIAL_MAP_ZOOM, LOCALSTORAGE_MAP_CENTER_KEY, LOCALSTORAGE_MAP_ZOOM_KEY } from '../constants';
import PointMarker from './PointMarker';

// Component to fix map rendering issue on initial load in flexbox layouts.
// This is a common workaround for a bug where the map doesn't fill its container.
const MapResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    // A slight delay ensures the container has its final size before Leaflet calculates tile positions.
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Cleanup function to clear the timeout if the component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [map]); // Reruns if map instance changes

  return null; // This component does not render anything
};

interface MapClickHandlerProps {
  onMapClick: (latlng: L.LatLng) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

// Component to save map state (center and zoom) to localStorage
const MapStateSaver: React.FC = () => {
  const map = useMapEvents({
    moveend: () => {
      try {
        localStorage.setItem(LOCALSTORAGE_MAP_CENTER_KEY, JSON.stringify([map.getCenter().lat, map.getCenter().lng]));
      } catch (error) {
        console.error("Error saving map center to localStorage:", error);
      }
    },
    zoomend: () => {
      try {
        localStorage.setItem(LOCALSTORAGE_MAP_ZOOM_KEY, map.getZoom().toString());
      } catch (error) {
        console.error("Error saving map zoom to localStorage:", error);
      }
    },
  });
  return null; // This component does not render anything
};


interface MapComponentProps {
  points: Point[];
  categories: Category[];
  isochrones: Record<string, IsochroneFetchResult>; // { [pointId]: { geojson?: GeoJSON.FeatureCollection, error?: string } }
  onMapClick: (latlng: L.LatLng) => void;
  onEditPoint: (point: Point) => void;
}

// Function to get initial map state from localStorage or defaults
const getInitialMapViewState = (): { center: [number, number]; zoom: number } => {
  let center: [number, number] = KRAKOW_CENTER_LATLNG;
  let zoom: number = INITIAL_MAP_ZOOM;

  try {
    const storedCenterStr = localStorage.getItem(LOCALSTORAGE_MAP_CENTER_KEY);
    if (storedCenterStr) {
      const parsedCenter = JSON.parse(storedCenterStr);
      if (Array.isArray(parsedCenter) && parsedCenter.length === 2 && typeof parsedCenter[0] === 'number' && typeof parsedCenter[1] === 'number') {
        center = [parsedCenter[0], parsedCenter[1]];
      } else {
        console.warn('Invalid map center found in localStorage. Using default.');
      }
    }

    const storedZoomStr = localStorage.getItem(LOCALSTORAGE_MAP_ZOOM_KEY);
    if (storedZoomStr) {
      const parsedZoom = parseInt(storedZoomStr, 10);
      if (!isNaN(parsedZoom)) {
        zoom = parsedZoom;
      } else {
        console.warn('Invalid map zoom found in localStorage. Using default.');
      }
    }
  } catch (error) {
    console.error("Error reading map state from localStorage. Using defaults:", error);
    // Fallback to defaults if parsing fails
    center = KRAKOW_CENTER_LATLNG;
    zoom = INITIAL_MAP_ZOOM;
  }
  return { center, zoom };
};

const initialMapView = getInitialMapViewState();


// Transforms GeoJSON polygon coordinates (array of rings, where each ring is [lng, lat] pairs)
// into Leaflet LatLngExpression[][] (array of rings, where each ring is [lat, lng] pairs).
// This format is suitable for Leaflet's <Polygon positions={...} /> prop for polygons with/without holes.
const transformGeoJsonPolygonToLeafletPositions = (rings: number[][][]): L.LatLngExpression[][] => {
  return rings.map(ring =>
    ring.map(pair => [pair[1], pair[0]] as L.LatLngExpression) // swap lng, lat to lat, lng
  );
};

const MapComponent: React.FC<MapComponentProps> = ({ points, categories, isochrones, onMapClick, onEditPoint }) => {
  return (
    <MapContainer center={initialMapView.center} zoom={initialMapView.zoom} scrollWheelZoom={true} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizeFix />
      <MapClickHandler onMapClick={onMapClick} />
      <MapStateSaver />
      
      {points.map(point => {
        const category = categories.find(c => c.id === point.categoryId);
        if (!category || !point.isVisible || !category.isVisible) return null;

        return (
          <PointMarker
            key={point.id}
            point={point}
            category={category}
            onEditPoint={onEditPoint}
          />
        );
      })}

      {Object.entries(isochrones).map(([pointId, isochroneResult]) => {
        const point = points.find(p => p.id === pointId);
        if (!point) return null;
        
        const category = categories.find(c => c.id === point.categoryId);
        if (!category || !point.isVisible || !category.isVisible || !isochroneResult.geojson || isochroneResult.geojson.features.length === 0) {
          return null;
        }
        
        // ORS typically returns a FeatureCollection with one Feature for an isochrone request.
        const feature = isochroneResult.geojson.features[0];
        if (!feature || !feature.geometry) { // Ensure feature and its geometry exist
             return null;
        }

        const pathOptions = { color: category.color, fillColor: category.color, fillOpacity: 0.3, weight: 2 };
        
        if (feature.geometry.type === 'Polygon') {
          // Explicitly cast to GeoJSON.Polygon after checking type
          const polygonGeometry = feature.geometry as GeoJSON.Polygon;
          const leafletPositions = transformGeoJsonPolygonToLeafletPositions(polygonGeometry.coordinates);
          return <Polygon key={`${pointId}-isochrone`} positions={leafletPositions} pathOptions={pathOptions} />;
        } else if (feature.geometry.type === 'MultiPolygon') {
          // Explicitly cast to GeoJSON.MultiPolygon
          const multiPolygonGeometry = feature.geometry as GeoJSON.MultiPolygon;
          // A MultiPolygon is an array of Polygon coordinate arrays. Render each as a separate Leaflet Polygon.
          return multiPolygonGeometry.coordinates.map((polygonCoords, index) => {
            const leafletPositions = transformGeoJsonPolygonToLeafletPositions(polygonCoords);
            return <Polygon key={`${pointId}-isochrone-part-${index}`} positions={leafletPositions} pathOptions={pathOptions} />;
          });
        }
        
        // Return null if the geometry type is not Polygon or MultiPolygon (or other unhandled types)
        return null;
      })}
    </MapContainer>
  );
};

export default MapComponent;