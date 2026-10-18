import dynamic from 'next/dynamic'
import type { ResourceMapView } from '../lib/geo'
import { translateCategory } from '../lib/messages'
import { useLanguage } from './LanguageProvider'

function MapLoading() {
  const { t } = useLanguage()
  return (
    <div className="map-shell grid place-items-center">
      <p className="note">{t('map.loading')}</p>
    </div>
  )
}

const ResourceMap = dynamic(() => import('./ResourceMap'), {
  ssr: false,
  loading: () => <MapLoading />,
})

type NearbyMapProps = {
  map: ResourceMapView
  selectedId: string | null
  onSelect: (id: string) => void
  onShowListing: (id: string) => void
}

export default function NearbyMap({ map, selectedId, onSelect, onShowListing }: NearbyMapProps) {
  const { t, language } = useLanguage()
  const pinCount = map.places.length
  const hiddenCount = map.unmapped_count
  const area = map.center?.label

  return (
    <div id="resource-map">
      <h3 className="font-serif text-2xl text-forest">{t('map.title')}</h3>
      <p className="note mt-1">
        {pinCount === 0
          ? t('map.none')
          : pinCount === 1
            ? t('map.pinnedOne')
            : t('map.pinnedMany', { count: pinCount })}
        {area ? ` ${t('map.center', { area })}` : ''}
        {' '}{t('map.confirm')}
      </p>
      {hiddenCount > 0 && pinCount > 0 && (
        <p className="note mt-1">
          {hiddenCount === 1
            ? t('map.hiddenOne')
            : t('map.hiddenMany', { count: hiddenCount })}
        </p>
      )}
      <div className="map-shell mt-3" data-pin-count={pinCount}>
        <ResourceMap
          center={map.center}
          places={map.places}
          selectedId={selectedId}
          onSelect={onSelect}
          onShowListing={onShowListing}
          labels={{
            showListing: t('card.showListing'),
            searchArea: t('map.center', { area: map.center?.label || '' }),
            searchAreaNote: t('map.confirm'),
            confirmLocation: t('map.confirm'),
          }}
          categoryLabel={(category) => translateCategory(language, category)}
        />
      </div>
      <ul className="sr-only">
        {map.center && <li>{t('map.center', { area: map.center.label })}</li>}
        {map.places.map((place, index) => (
          <li key={place.id}>
            {index + 1}: {place.name}
            {place.detail ? `. ${place.detail}` : ''}
            {place.distance_label ? `. ${place.distance_label}` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
