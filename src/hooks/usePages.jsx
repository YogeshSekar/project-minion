import { useCallback, useEffect, useState } from 'react'
import {
  createPage as createPageService,
  deletePage as deletePageService,
  getPages,
  updatePage as updatePageService
} from '../services/pageService'

const sortPages = pages => [...pages].sort((a, b) =>
  a.sort_order - b.sort_order || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
)

function usePages() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadPages = useCallback(async () => {
    setLoading(true)
    setError(null)
    const response = await getPages()
    if (response.success) setPages(sortPages(response.data || []))
    else setError(response.error || 'Could not load pages')
    setLoading(false)
    return response
  }, [])

  const createPage = async payload => {
    setError(null)
    const response = await createPageService(payload)
    if (response.success && response.data) {
      setPages(current => sortPages([...current, response.data]))
    } else {
      setError(response.error || 'Could not create page')
    }
    return response
  }

  const updatePage = async payload => {
    setError(null)
    const response = await updatePageService(payload)
    if (response.success && response.data) {
      setPages(current => sortPages(current.map(page => page.id === response.data.id ? response.data : page)))
    } else {
      setError(response.error || 'Could not update page')
    }
    return response
  }

  const deletePage = async id => {
    setError(null)
    const response = await deletePageService(id)
    if (response.success) setPages(current => current.filter(page => page.id !== id))
    else setError(response.error || 'Could not delete page')
    return response
  }

  useEffect(() => {
    loadPages()
  }, [loadPages])

  return { pages, loading, error, loadPages, createPage, updatePage, deletePage }
}

export default usePages
