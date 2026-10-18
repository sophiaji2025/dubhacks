import { loadPublishedResources } from './db'
import { resolveResourceMap } from './geocode'
import type { ResourceMapView } from './geo'
import { resourceFromRow, type Resource } from './matching'
import { getSupabaseAdmin } from './supabase'

export const SEATTLE_DIRECTORY = {
  city: 'seattle',
  cityLabel: 'Seattle',
  locationLabel: 'Seattle',
}

/**
 * Pins every published listing that has saved coordinates or a street address.
 * A citywide program with no street address stays off the map.
 */
export async function loadDirectoryMap(): Promise<ResourceMapView> {
  const loaded = await loadPublishedResources({ limit: 100 })
  const resources = loaded.rows
    .map(resourceFromRow)
    .filter((resource): resource is Resource => resource !== null)
  const map = await resolveResourceMap(resources, SEATTLE_DIRECTORY)
  await storeGeocodedPoints(map)
  return map
}

async function storeGeocodedPoints(map: ResourceMapView): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return
  const located = map.places.filter((place) => place.approximate && !place.id.startsWith('curated-'))
  if (located.length === 0) return
  try {
    const admin = getSupabaseAdmin()
    await Promise.all(located.map((place) => admin
      .from('resources')
      .update({ latitude: place.latitude, longitude: place.longitude })
      .eq('id', place.id)
      .is('latitude', null)))
  } catch (error) {
    console.error('could not save resource coordinates', error instanceof Error ? error.message : 'unknown error')
  }
}
