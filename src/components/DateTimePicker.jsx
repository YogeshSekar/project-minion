import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react'

export const parseLocalDate = value => {
  if (!value || value === '0') return null
  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

export const toLocalDateValue = date => {
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const formatLocalDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  const date = parseLocalDate(value)
  return date ? date.toLocaleDateString(undefined, options) : ''
}

function DateTimePicker({ value, onChange, onClose, position = null }) {
  const parsedValue = useMemo(() => parseLocalDate(value), [value])
  const [currentDate, setCurrentDate] = useState(parsedValue || new Date())
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  useEffect(() => { if (parsedValue) setCurrentDate(parsedValue) }, [parsedValue])
  useEffect(() => {
    const closeOnEscape = event => { if (event.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const calendarDays = useMemo(() => {
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const count = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    return [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, index) => new Date(currentDate.getFullYear(), currentDate.getMonth(), index + 1))]
  }, [currentDate])

  const choose = useCallback(date => onChange(toLocalDateValue(date)), [onChange])
  const sameDay = (left, right) => left && right && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
  const today = new Date()
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)

  return (
    <div
      data-date-picker
      className={`${position ? 'fixed' : 'absolute left-0 top-0'} z-[100] w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.22)]`}
      style={position ? { top: position.top, left: position.left } : undefined}
      onMouseDown={event => event.stopPropagation()}
    >
      <div className="grid grid-cols-3 gap-1.5 border-b border-slate-100 pb-3">
        {[[today, 'Today', CalendarDays], [tomorrow, 'Tomorrow', Clock3], [nextWeek, 'Next week', ChevronRight]].map(([date, label, Icon]) => (
          <button key={label} type="button" onClick={() => choose(date)} className="flex h-8 items-center justify-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"><Icon className="h-3.5 w-3.5" />{label}</button>
        ))}
      </div>

      <div className="flex items-center justify-between py-3">
        <button type="button" onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-semibold text-slate-900">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        <button type="button" onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">{weekDays.map(day => <span key={day} className="py-1 text-center text-[10px] font-semibold uppercase text-slate-400">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => <button key={date ? toLocalDateValue(date) : `empty-${index}`} type="button" disabled={!date} onClick={() => date && choose(date)} className={`grid h-8 w-8 place-items-center rounded-full text-xs font-medium transition-colors ${!date ? 'invisible' : sameDay(date, parsedValue) ? 'bg-indigo-600 font-semibold text-white' : sameDay(date, today) ? 'bg-indigo-50 font-semibold text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-700 hover:bg-slate-100'}`}>{date?.getDate()}</button>)}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <button type="button" onClick={() => onChange('')} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" />Clear</button>
        <button type="button" onClick={() => onClose?.()} className="h-8 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">Close</button>
      </div>
    </div>
  )
}

export default DateTimePicker
