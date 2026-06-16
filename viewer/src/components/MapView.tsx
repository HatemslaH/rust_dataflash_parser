import * as MTP from "@dvt3d/maplibre-three-plugin";
import { Center, Stack, Text } from "@mantine/core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGpsTrajectory } from "../hooks/useFieldSeries";
import { useSessionStore } from "../stores/sessionStore";
import { useTimeStore } from "../stores/timeStore";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function findIndexAtTime(timeMs: number[] | null, target: number | null): number {
  if (!timeMs || timeMs.length === 0 || target === null) return 0;
  let idx = 0;
  for (let i = 0; i < timeMs.length; i++) {
    if (timeMs[i]! <= target) idx = i;
    else break;
  }
  return idx;
}

export function MapView() {
  const summary = useSessionStore((s) => s.summary);
  const hoveredTimeMs = useTimeStore((s) => s.hoveredTimeMs);
  const { lats, lngs, timeMs, isLoading, isError } = useGpsTrajectory(summary !== null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapSceneRef = useRef<MTP.MapScene | null>(null);
  const vehicleRef = useRef<THREE.Group | null>(null);
  const rtcGroupRef = useRef<THREE.Group | null>(null);
  const didFitBoundsRef = useRef(false);
  const lastCursorIdxRef = useRef(-1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !summary) return;

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      center: [149.16523, -35.36325],
      zoom: 14,
      pitch: 55,
      bearing: -20,
      canvasContextAttributes: { antialias: true },
      maxPitch: 85,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    const mapScene = new MTP.MapScene(map as never);
    mapScene.addLight(new THREE.AmbientLight(0xffffff, 0.9));
    mapScene.addLight(new THREE.DirectionalLight(0xffffff, 0.6));
    mapSceneRef.current = mapScene;

    const vehicle = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(4, 12, 4),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.3, roughness: 0.4 }),
    );
    body.rotation.x = Math.PI / 2;
    vehicle.add(body);
    vehicleRef.current = vehicle;

    map.on("load", () => {
      map.addSource("trajectory", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "trajectory-line",
        type: "line",
        source: "trajectory",
        paint: {
          "line-color": "#06b6d4",
          "line-width": 3,
          "line-opacity": 0.85,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });
      map.addLayer({
        id: "trajectory-cursor",
        type: "circle",
        source: "trajectory",
        filter: ["==", ["get", "kind"], "cursor"],
        paint: {
          "circle-radius": 7,
          "circle-color": "#f59e0b",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    });

    return () => {
      didFitBoundsRef.current = false;
      lastCursorIdxRef.current = -1;
      mapSceneRef.current = null;
      vehicleRef.current = null;
      rtcGroupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [summary]);

  useEffect(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [summary, isLoading, isError, lats]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !lats || !lngs || lats.length === 0) return;

    const coords: [number, number][] = lats.map((lat, i) => [lngs[i]!, lat]);
    const lineFeature = {
      type: "Feature" as const,
      properties: { kind: "path" },
      geometry: { type: "LineString" as const, coordinates: coords },
    };

    const idx = findIndexAtTime(timeMs, hoveredTimeMs);
    const cursorFeature = {
      type: "Feature" as const,
      properties: { kind: "cursor" },
      geometry: {
        type: "Point" as const,
        coordinates: [lngs[idx]!, lats[idx]!] as [number, number],
      },
    };

    const source = map.getSource("trajectory") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [lineFeature, cursorFeature],
      });
    }

    if (idx !== lastCursorIdxRef.current) {
      lastCursorIdxRef.current = idx;
      const mapScene = mapSceneRef.current;
      const vehicle = vehicleRef.current;
      if (mapScene && vehicle) {
        if (rtcGroupRef.current) {
          mapScene.removeObject(rtcGroupRef.current);
        }
        const rtcGroup = MTP.Creator.createRTCGroup(
          [lngs[idx]!, lats[idx]!],
          [0, 0, 0],
          [1, 1, 1],
        );
        rtcGroup.add(vehicle);
        mapScene.addObject(rtcGroup);
        rtcGroupRef.current = rtcGroup;
      }
    }

    if (!didFitBoundsRef.current && coords.length > 1) {
      didFitBoundsRef.current = true;
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0]!, coords[0]!),
      );
      map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 0 });
    }
  }, [lats, lngs, timeMs, hoveredTimeMs]);

  if (!summary) {
    return (
      <Center flex={1} p="xl">
        <Stack align="center" gap="xs">
          <Text c="dimmed">3D trajectory map</Text>
          <Text size="sm" c="dimmed">
            Open a log to display GPS trajectory.
          </Text>
        </Stack>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center flex={1} p="xl">
        <Text c="dimmed">Loading map data…</Text>
      </Center>
    );
  }

  if (isError || !lats || lats.length === 0) {
    return (
      <Center flex={1} p="xl">
        <Stack align="center" gap="xs">
          <Text c="dimmed">No map data</Text>
          <Text size="sm" c="dimmed">
            This log does not contain enough GPS data to display on the map.
          </Text>
        </Stack>
      </Center>
    );
  }

  return <div ref={containerRef} className="map-container" />;
}
