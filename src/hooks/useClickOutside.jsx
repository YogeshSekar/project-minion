import { useRef, useEffect, useState, useCallback } from 'react'

function useClickOutside(initialOpenState = false) {
  const ref = useRef(null)
  const [isOpen, setIsOpen] = useState(initialOpenState)

  const handleClickOutside = useCallback((event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen, handleClickOutside])

  return {
    ref,
    isOpen,
    setIsOpen
  }
}

export default useClickOutside
