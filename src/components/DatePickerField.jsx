import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays } from 'lucide-react'
import DateTimePicker, { formatLocalDate } from './DateTimePicker'

function DatePickerField({ value, onChange, placeholder = 'Select date', ariaLabel = 'Select date', className = '', compact = false }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = 320
    const estimatedHeight = 410
    const gutter = 10
    const left = Math.min(Math.max(gutter, rect.left), Math.max(gutter, window.innerWidth - width - gutter))
    const below = rect.bottom + 6
    const top = below + estimatedHeight <= window.innerHeight - gutter ? below : Math.max(gutter, rect.top - estimatedHeight - 6)
    setPosition({ top, left })
  }, [])

  useLayoutEffect(() => {
    if (!open) return undefined
    updatePosition()
    return undefined
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = event => {
      if (!triggerRef.current?.contains(event.target) && !event.target.closest?.('[data-date-picker]')) setOpen(false)
    }
    const reposition = () => updatePosition()
    document.addEventListener('mousedown', closeOutside)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, updatePosition])

  const togglePicker = () => {
    if (open) {
      setOpen(false)
      return
    }
    updatePosition()
    setOpen(true)
  }

  const choose = next => {
    onChange(next)
    setOpen(false)
  }

  return (
    <>
      <button ref={triggerRef} type="button" onClick={togglePicker} aria-label={ariaLabel} aria-expanded={open} className={`${compact ? 'h-7 px-2.5 text-xs' : 'h-9 px-3 text-sm'} inline-flex min-w-0 items-center gap-1.5 rounded-full border transition-colors ${open ? 'border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50'} ${className}`}>
        <CalendarDays className="h-3.5 w-3.5 flex-none text-indigo-600" />
        <span className="truncate font-semibold">{formatLocalDate(value) || placeholder}</span>
      </button>
      {open && createPortal(<DateTimePicker value={value} onChange={choose} onClose={() => setOpen(false)} position={position} />, document.body)}
    </>
  )
}

export default DatePickerField
