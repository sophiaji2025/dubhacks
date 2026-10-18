import { useEffect, useRef } from 'react'
import type { LayerGroup, Map as LeafletMap, Marker } from 'leaflet'
import type { MapCenter, MapPlace } from '../lib/geo'

type LeafletModule = typeof import('leaflet')

export type MapPopupLabels = {
  showListing: string
  searchArea: string
  searchAreaNote: string
  confirmLocation: string
}

type ResourceMapProps = {
  center: MapCenter | null
  places: MapPlace[]
  selectedId: string | null
  onSelect: (id: string) => void
  onShowListing: (id: string) => void
  labels?: MapPopupLabels
  categoryLabel?: (category: string) => string
}

const SEATTLE_VIEW: [number, number] = [47.6062, -122.3321]

const DEFAULT_LABELS: MapPopupLabels = {
  showListing: 'Show listing',
  searchArea: 'Search area',
  searchAreaNote: 'This is the center of the city or ZIP you entered, not your exact location.',
  confirmLocation: 'Confirm this location with the provider before you go.',
}

export default function ResourceMap({
  center,
  places,
  selectedId,
  onSelect,
  onShowListing,
  labels = DEFAULT_LABELS,
  categoryLabel = (category) => category,
}: ResourceMapProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const groupRef = useRef<LayerGroup | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const placesRef = useRef(places)
  const centerRef = useRef(center)
  const selectedRef = useRef(selectedId)
  const onSelectRef = useRef(onSelect)
  const onShowListingRef = useRef(onShowListing)
  const labelsRef = useRef(labels)
  const categoryLabelRef = useRef(categoryLabel)

  placesRef.current = places
  centerRef.current = center
  selectedRef.current = selectedId
  onSelectRef.current = onSelect
  onShowListingRef.current = onShowListing
  labelsRef.current = labels
  categoryLabelRef.current = categoryLabel

  useEffect(() => {
    const node = nodeRef.current
    if (!node || mapRef.current) return
    let cancelled = false
    let frame = 0

    const start = async () => {
      const L = leafletApi(await import('leaflet'))
      if (cancelled || !nodeRef.current) return
      const map = L.map(nodeRef.current, {
        scrollWheelZoom: false,
        center: SEATTLE_VIEW,
        zoom: 12,
      })
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      const group = L.layerGroup().addTo(map)
      mapRef.current = map
      groupRef.current = group
      frame = requestAnimationFrame(() => {
        if (cancelled || !mapRef.current || !groupRef.current) return
        drawPlaces(L, map, group)
      })
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      mapRef.current?.remove()
      mapRef.current = null
      groupRef.current = null
      markersRef.current.clear()
    }
    // The map is created once. Later searches redraw the same map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const group = groupRef.current
    if (!map || !group) return
    let cancelled = false
    void import('leaflet').then((leaflet) => {
      if (cancelled) return
      drawPlaces(leafletApi(leaflet), map, group)
    })
    return () => {
      cancelled = true
    }
  }, [center, places, labels, categoryLabel])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const marker = markersRef.current.get(selectedId)
    const place = placesRef.current.find((item) => item.id === selectedId)
    if (!marker || !place) return
    void import('leaflet').then((leaflet) => {
      const L = leafletApi(leaflet)
      markersRef.current.forEach((item, id) => {
        const index = placesRef.current.findIndex((entry) => entry.id === id)
        item.setIcon(pinIcon(L, index + 1, id === selectedId))
      })
    })
    map.panTo([place.latitude, place.longitude], { animate: true })
    marker.openPopup()
  }, [selectedId])

  function drawPlaces(
    L: LeafletModule,
    map: LeafletMap,
    group: LayerGroup,
  ) {
    group.clearLayers()
    markersRef.current.clear()
    const currentPlaces = placesRef.current
    const currentCenter = centerRef.current
    const currentSelected = selectedRef.current

    if (currentCenter) {
      const area = L.circleMarker([currentCenter.latitude, currentCenter.longitude], {
        radius: 7,
        color: '#C77957',
        weight: 2,
        fillColor: '#F8F6EF',
        fillOpacity: 1,
      })
      area.bindPopup(searchAreaPopup(labelsRef.current.searchArea, labelsRef.current.searchAreaNote))
      area.addTo(group)
    }

    currentPlaces.forEach((place, index) => {
      const marker = L.marker([place.latitude, place.longitude], {
        icon: pinIcon(L, index + 1, place.id === currentSelected),
        keyboard: true,
        title: place.name,
        alt: `${place.name} on the map`,
      })
      marker.bindPopup(() => popupElement(
        place,
        (id) => onShowListingRef.current(id),
        labelsRef.current,
        categoryLabelRef.current,
      ))
      marker.on('click', () => onSelectRef.current(place.id))
      marker.addTo(group)
      markersRef.current.set(place.id, marker)
    })

    const points: [number, number][] = currentPlaces.map((place) => [place.latitude, place.longitude])
    if (currentCenter) points.push([currentCenter.latitude, currentCenter.longitude])
    map.invalidateSize()
    if (currentPlaces.length === 0) {
      const view = currentCenter
        ? [currentCenter.latitude, currentCenter.longitude] as [number, number]
        : SEATTLE_VIEW
      map.setView(view, 12, { animate: false })
    } else if (points.length === 1) {
      map.setView(points[0], 14, { animate: false })
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14, animate: false })
    }

    if (currentSelected) {
      const marker = markersRef.current.get(currentSelected)
      const place = currentPlaces.find((item) => item.id === currentSelected)
      if (marker && place) marker.openPopup()
    }
  }

  return (
    <div ref={nodeRef} className="h-full w-full" />
  )
}

function leafletApi(imported: LeafletModule): LeafletModule {
  const candidate = (imported as LeafletModule & { default?: LeafletModule }).default
  return typeof candidate?.map === 'function' ? candidate : imported
}

function pinIcon(L: LeafletModule, number: number, selected: boolean) {
  return L.divIcon({
    className: 'map-pin-wrap',
    html: `<span class="map-pin${selected ? ' is-selected' : ''}">${number}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function searchAreaPopup(titleText: string, noteText: string): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'text-sm text-charcoal'
  const title = document.createElement('p')
  title.className = 'font-medium text-forest'
  title.textContent = titleText
  const note = document.createElement('p')
  note.textContent = noteText
  wrap.append(title, note)
  return wrap
}

function popupElement(
  place: MapPlace,
  onShowListing: (id: string) => void,
  labels: MapPopupLabels,
  categoryLabel: (category: string) => string,
): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'text-sm text-charcoal'

  const title = document.createElement('p')
  title.className = 'font-medium text-forest'
  title.textContent = place.name
  wrap.append(title)

  if (place.category) {
    const category = document.createElement('p')
    category.textContent = categoryLabel(place.category)
    wrap.append(category)
  }
  if (place.detail) {
    const detail = document.createElement('p')
    detail.textContent = place.detail
    wrap.append(detail)
  }
  if (place.distance_label) {
    const distance = document.createElement('p')
    distance.textContent = place.distance_label
    wrap.append(distance)
  }

  const note = document.createElement('p')
  note.className = 'text-muted'
  note.textContent = labels.confirmLocation
  wrap.append(note)

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'link mt-1'
  button.textContent = labels.showListing
  button.addEventListener('click', () => onShowListing(place.id))
  wrap.append(button)
  return wrap
}
