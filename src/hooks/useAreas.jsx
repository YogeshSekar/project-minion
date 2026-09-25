import { useCallback, useEffect, useState } from 'react'
import {
  createArea as createAreaService,
  deleteArea as deleteAreaService,
  getAreas,
  updateArea as updateAreaService
} from '../services/areaService'

const sortAreas = areas => [...areas].sort((a, b) =>
  a.project_id - b.project_id || a.sort_order - b.sort_order || a.title.localeCompare(b.title)
)

function useAreas() {
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAreas = useCallback(async () => {
    setLoading(true)
    setError(null)
    const response = await getAreas()
    if (response.success) setAreas(sortAreas(response.data || []))
    else setError(response.error || 'Could not load areas')
    setLoading(false)
    return response
  }, [])

  const createArea = async payload => {
    setError(null)
    const response = await createAreaService(payload)
    if (response.success && response.data) {
      setAreas(current => sortAreas([...current, response.data]))
    } else {
      setError(response.error || 'Could not create area')
    }
    return response
  }

  const updateArea = async payload => {
    setError(null)
    const response = await updateAreaService(payload)
    if (response.success && response.data) {
      setAreas(current => sortAreas(current.map(area => area.id === response.data.id ? response.data : area)))
    } else {
      setError(response.error || 'Could not update area')
    }
    return response
  }

  const deleteArea = async id => {
    setError(null)
    const response = await deleteAreaService(id)
    if (response.success) setAreas(current => current.filter(area => area.id !== id))
    else setError(response.error || 'Could not delete area')
    return response
  }

  useEffect(() => {
    loadAreas()
  }, [loadAreas])

  return { areas, loading, error, loadAreas, createArea, updateArea, deleteArea }
}

export default useAreas
