import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Node, mergeAttributes } from '@tiptap/core'
import { useEffect, useCallback } from 'react'

// Custom Resizable Image Extension - replaces the default Image extension
const ResizableImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,
  
  addAttributes() {
    return {
      src: { 
        default: null,
        parseHTML: element => element.getAttribute('src'),
      },
      alt: { 
        default: null,
        parseHTML: element => element.getAttribute('alt'),
      },
      title: { 
        default: null,
        parseHTML: element => element.getAttribute('title'),
      },
      width: { 
        default: '100%',
        parseHTML: element => {
          // Try to get width from style or width attribute
          const style = element.getAttribute('style')
          if (style) {
            const widthMatch = style.match(/width:\s*([^;]+)/)
            if (widthMatch) return widthMatch[1].trim()
          }
          return element.getAttribute('width') || '100%'
        },
      },
      height: { 
        default: 'auto',
        parseHTML: element => element.getAttribute('height') || 'auto',
      },
    }
  },
  
  parseHTML() {
    return [{ 
      tag: 'img[src]',
      getAttrs: element => {
        // Only parse images - let ResizableImage handle everything
        return {
          src: element.getAttribute('src'),
          alt: element.getAttribute('alt'),
          title: element.getAttribute('title'),
          width: (() => {
            const style = element.getAttribute('style')
            if (style) {
              const widthMatch = style.match(/width:\s*([^;]+)/)
              if (widthMatch) return widthMatch[1].trim()
            }
            return element.getAttribute('width') || '100%'
          })(),
          height: element.getAttribute('height') || 'auto',
        }
      }
    }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, {
      style: `width: ${HTMLAttributes.width || '100%'}; height: ${HTMLAttributes.height || 'auto'}; max-width: 100%;`
    })]
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const container = document.createElement('div')
      container.className = 'resizable-image-container relative inline-block group'
      container.style.width = node.attrs.width || '100%'
      container.style.maxWidth = '100%'
      
      const img = document.createElement('img')
      img.src = node.attrs.src
      img.alt = node.attrs.alt || ''
      img.className = 'rounded-lg cursor-pointer'
      img.style.width = '100%'
      img.style.height = 'auto'
      img.style.display = 'block'
      
      // Resize handles
      const handles = ['se', 'sw', 'ne', 'nw']
      handles.forEach(handle => {
        const handleEl = document.createElement('div')
        handleEl.className = `resize-handle resize-handle-${handle} absolute w-3 h-3 bg-white border-2 border-blue-500 rounded opacity-0 group-hover:opacity-100 transition-opacity`
        handleEl.style.cursor = `${handle}-resize`
        
        // Position handles
        if (handle.includes('n')) handleEl.style.top = '-6px'
        if (handle.includes('s')) handleEl.style.bottom = '-6px'
        if (handle.includes('w')) handleEl.style.left = '-6px'
        if (handle.includes('e')) handleEl.style.right = '-6px'
        
        let isResizing = false
        let startX, startY, startWidth
        
        handleEl.addEventListener('mousedown', (e) => {
          e.preventDefault()
          e.stopPropagation()
          isResizing = true
          startX = e.clientX
          startY = e.clientY
          startWidth = container.offsetWidth
          
          const onMouseMove = (e) => {
            if (!isResizing) return
            const deltaX = e.clientX - startX
            const newWidth = Math.max(50, startWidth + deltaX)
            container.style.width = `${newWidth}px`
          }
          
          const onMouseUp = () => {
            if (isResizing) {
              isResizing = false
              const pos = getPos()
              if (pos !== undefined) {
                editor.chain().focus().setNodeSelection(pos).updateAttributes('image', { 
                  width: container.style.width 
                }).run()
              }
            }
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
          }
          
          document.addEventListener('mousemove', onMouseMove)
          document.addEventListener('mouseup', onMouseUp)
        })
        
        container.appendChild(handleEl)
      })
      
      container.appendChild(img)
      
      // Click to select
      container.addEventListener('click', (e) => {
        e.preventDefault()
        const pos = getPos()
        if (pos !== undefined) {
          editor.chain().focus().setNodeSelection(pos).run()
        }
      })
      
      return { dom: container }
    }
  },
})

function TipTapEditor({ content, onChange, editable = true, moveCursorToEnd = false, onSave }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the image in StarterKit so we can use our custom one
        bulletList: true,
        orderedList: true,
        listItem: true,
        blockquote: true,
        codeBlock: true,
        code: true,
        horizontalRule: true,
        heading: true,
        bold: true,
        italic: true,
        strike: true,
        dropcursor: true,
        gapcursor: true,
        hardBreak: true,
      }),
      ResizableImage.configure({
        allowBase64: true,
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
    ],
    content: content || '<p></p>',
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update content when prop changes (but not when typing)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>')
    }
  }, [content, editor])

  // Move cursor to end when prop changes
  useEffect(() => {
    if (editor && moveCursorToEnd) {
      const endPos = editor.state.doc.content.size
      editor.chain().focus().setTextSelection(endPos).run()
    }
  }, [moveCursorToEnd, editor])

  if (!editor) {
    return null
  }
  
  // Handle file drop/paste
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result
            if (base64) {
              editor.chain().focus().insertContent({
                type: 'image',
                attrs: { src: base64, width: '400px' }
              }).run()
            }
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }, [editor])
  
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (blob) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result
            if (base64) {
              editor.chain().focus().insertContent({
                type: 'image',
                attrs: { src: base64, width: '400px' }
              }).run()
            }
          }
          reader.readAsDataURL(blob)
        }
        return
      }
    }
  }, [editor])
  
  // Add image from file picker
  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = e.target?.files
      if (files) {
        Array.from(files).forEach(file => {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result
            if (base64) {
              editor.chain().focus().insertContent({
                type: 'image',
                attrs: { src: base64, width: '400px' }
              }).run()
            }
          }
          reader.readAsDataURL(file)
        })
      }
    }
    input.click()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-none px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1 flex-wrap">
        {/* Text Style */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${
            editor.isActive('bold')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 text-sm italic rounded transition-colors ${
            editor.isActive('italic')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 text-sm line-through rounded transition-colors ${
            editor.isActive('strike')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Strikethrough"
        >
          S
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Heading 2"
        >
          H2
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 10h1v4H4v-4zm2 0h10v4H6v-4zm12 0h1v4h-1v-4z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 4h14v9H7v-2h14v-2H7V9z"/>
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Block styles */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Quote"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 17h3l2-4V7H7v6h4l-2 4zm8 0h3l2-4V7h-4v6h4l-2 4z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('codeBlock')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Code Block"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Link */}
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('link')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Add Link"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </button>

        {/* Image - File Upload */}
        <button
          onClick={handleFileSelect}
          className="p-1.5 rounded transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Upload Image (or paste from clipboard)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <div className="flex-1" />

        {/* Save button */}
        {onSave && (
          <button
            onClick={onSave}
            className="px-5 py-2 text-sm font-medium rounded-full transition-colors bg-gray-900 hover:bg-gray-700 text-white"
          >
            Save
          </button>
        )}
      </div>

      {/* Editor */}
      <div 
        className="flex-1 overflow-y-auto relative"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
      >
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none min-h-[200px] h-full
            prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1
            prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
            prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-pre:p-3 prose-pre:rounded-lg
            prose-img:max-w-full prose-img:rounded-lg
            [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:h-full [&_.ProseMirror]:outline-none
            [&_.resizable-image-container]:relative [&_.resizable-image-container]:inline-block
            [&_.resize-handle]:absolute [&_.resize-handle]:w-3 [&_.resize-handle]:h-3 [&_.resize-handle]:bg-white [&_.resize-handle]:border-2 [&_.resize-handle]:border-blue-500 [&_.resize-handle]:rounded [&_.resize-handle]:opacity-0 [&_.resize-handle]:hover:opacity-100 [&_.resize-handle]:transition-opacity [&_.resize-handle]:z-10
            [&_.resize-handle-se]:bottom-[-6px] [&_.resize-handle-se]:right-[-6px] [&_.resize-handle-se]:cursor-se-resize
            [&_.resize-handle-sw]:bottom-[-6px] [&_.resize-handle-sw]:left-[-6px] [&_.resize-handle-sw]:cursor-sw-resize
            [&_.resize-handle-ne]:top-[-6px] [&_.resize-handle-ne]:right-[-6px] [&_.resize-handle-ne]:cursor-ne-resize
            [&_.resize-handle-nw]:top-[-6px] [&_.resize-handle-nw]:left-[-6px] [&_.resize-handle-nw]:cursor-nw-resize"
        />
        {/* Drop zone indicator */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 transition-opacity">
          <div className="bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-lg p-8">
            <p className="text-blue-600 font-medium">Drop images here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TipTapEditor
