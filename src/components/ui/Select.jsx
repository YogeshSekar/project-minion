import { Check, ChevronDown } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside'

const optionValue = option => typeof option === 'object' ? option.value : option
const optionLabel = option => typeof option === 'object' ? (option.label ?? option.title ?? option.name ?? option.value) : option

function Select({ value, onChange, options = [], placeholder = 'Select…', className = '', triggerClassName = '', menuClassName = '', disabled = false, ariaLabel }) {
  const { ref, isOpen, setIsOpen } = useClickOutside()
  const selected = options.find(option => String(optionValue(option)) === String(value))
  const handleSelect = option => {
    onChange(optionValue(option), option)
    setIsOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={isOpen} className={`flex h-9 w-full items-center justify-between gap-2 rounded-full border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-700 outline-none transition-colors hover:border-accent-border hover:bg-slate-50 focus-visible:border-accent-focus focus-visible:ring-2 focus-visible:ring-accent-focus/30 disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName}`}>
        <span className="min-w-0 flex-1 truncate">{selected ? optionLabel(selected) : placeholder}</span>
        <ChevronDown className={`h-4 w-4 flex-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div role="listbox" className={`absolute left-0 top-full z-[80] mt-1 max-h-64 min-w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${menuClassName}`}>
          {options.map((option, index) => {
            const nextValue = optionValue(option)
            const isSelected = String(value) === String(nextValue)
            return (
              <button type="button" role="option" aria-selected={isSelected}
                key={`${nextValue}-${index}`}
                onClick={() => handleSelect(option)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-accent-surface font-semibold text-accent-text' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span className="min-w-0 flex-1 truncate">{optionLabel(option)}</span>{isSelected && <Check className="h-4 w-4 flex-none" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Select
