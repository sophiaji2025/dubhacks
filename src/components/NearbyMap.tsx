import dynamic from 'next/dynamic'
import type { ResourceMapView } from '../lib/geo'

const ResourceMap = dynamic(() => import('./ResourceMap'), {
  ssr: false,
  loading: () => (
    <div className="map-shell grid place-items-center">
      <p className="note">Loading map…</p>
    </div>
  ),
})

type NearbyMapProps = {
  map: ResourceMapView
  selectedId: string | null
  onSelect: (id: string) => void
  onShowListing: (id: string) => void
}

export default function NearbyMap({ map, selectedId, onSelect, onShowListing }: NearbyMapProps) {
  const pinCount = map.places.length
  const hiddenCount = map.unmapped_count
  const area = map.center?.label

  return (
    <div id="resource-map">
      <h3 className="font-serif text-2xl text-forest">Nearby</h3>
      <p className="note mt-1">
        {pinCount === 0
          ? 'No listing in these results has a street address or saved coordinates to pin.'
          : `${pinCount} listing${pinCount === 1 ? '' : 's'} ${pinCount === 1 ? 'is' : 'are'} pinned.`}
        {area ? ` The circle marks the center of ${area}, not your exact location.` : ''}
        {' '}Confirm a location with the provider before you go.
      </p>
      {hiddenCount > 0 && pinCount > 0 && (
        <p className="note mt-1">
          {hiddenCount === 1
            ? '1 listing stays off the map because no street address or saved coordinates are listed.'
            : `${hiddenCount} listings stay off the map because no street address or saved coordinates are listed.`}
        </p>
      )}
      <div className="map-shell mt-3" data-pin-count={pinCount}>
        <ResourceMap
          center={map.center}
          places={map.places}
          selectedId={selectedId}
          onSelect={onSelect}
          onShowListing={onShowListing}
        />
      </div>
      <ul className="sr-only">
        {map.center && <li>Search area center: {map.center.label}.</li>}
        {map.places.map((place, index) => (
          <li key={place.id}>
            Pin {index + 1}: {place.name}
            {place.detail ? `. ${place.detail}` : ''}
            {place.distance_label ? `. ${place.distance_label}` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
