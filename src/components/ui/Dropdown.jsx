import React from 'react'
import useClickOutside from '../../hooks/useClickOutside'

function Dropdown({ 
  trigger, 
  children, 
  className = '',
  contentClassName = '',
  align = 'left' // 'left', 'right', 'center'
}) {
  const { ref, isOpen, setIsOpen } = useClickOutside()

  const handleTriggerClick = () => {
    setIsOpen(!isOpen)
  }

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      {/* Trigger Element */}
      <div onClick={handleTriggerClick} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div 
          className={`absolute z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1 min-w-[160px] ${alignmentClasses[align]} ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export default Dropdown
