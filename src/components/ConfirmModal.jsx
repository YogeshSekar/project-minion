import { useState, useEffect } from 'react'

function ConfirmModal({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, type = 'confirm' }) {
  if (!isOpen) return null

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-todoist-red hover:bg-todoist-red-hover',
          icon: 'text-todoist-red'
        }
      case 'success':
        return {
          confirm: 'bg-green-600 hover:bg-green-700',
          icon: 'text-green-600'
        }
      default:
        return {
          confirm: 'bg-todoist-red hover:bg-todoist-red-hover',
          icon: 'text-todoist-red'
        }
    }
  }

  const colors = getColors()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-todoist-sidebar-bg flex items-center justify-center ${colors.icon}`}>
              {type === 'danger' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-todoist-text-primary">{title}</h3>
            </div>
          </div>
          
          <p className="text-todoist-text-secondary mb-6">{message}</p>
          
          <div className="flex gap-3">
            {cancelText && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-todoist-sidebar-bg text-todoist-text-secondary rounded-lg hover:bg-todoist-sidebar-hover transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${colors.confirm}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
