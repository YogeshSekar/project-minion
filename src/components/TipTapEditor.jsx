import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Underline } from '@tiptap/extension-underline'
import { Highlight } from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Node, mergeAttributes } from '@tiptap/core'
import { useEffect, useCallback, useState, useRef } from 'react'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Highlighter, 
  ImagePlus,
  Link as LinkIcon,
  Pin,
  FileText,
  Undo2,
  Redo2,
  List,
  ListOrdered,
  Quote,
  Code,
  ChevronDown,
  Table as TableIcon
} from 'lucide-react'

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

function TipTapEditor({ content, onChange, editable = true, moveCursorToEnd = false, onSave, showToolbar = true, hideScrollbar = false, compact = false, maxImageBytes, onImageError, onPinSelection, pinnedItems = [], onUnpin, pinBusy = false, pageLinkOptions = [], onPinPageLink, onOpenPageLink }) {
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
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
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

  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false)
  const styleDropdownRef = useRef(null)
  
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false)
  const tableDropdownRef = useRef(null)
  const [pageLinkOpen, setPageLinkOpen] = useState(false)
  const [pageLinkSearch, setPageLinkSearch] = useState('')
  const [pinNewPageLink, setPinNewPageLink] = useState(false)
  const pageLinkRef = useRef(null)
  const pageLinkSelectionRef = useRef(null)

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
        setIsStyleDropdownOpen(false)
      }
      if (tableDropdownRef.current && !tableDropdownRef.current.contains(event.target)) {
        setIsTableDropdownOpen(false)
      }
      if (pageLinkRef.current && !pageLinkRef.current.contains(event.target)) {
        setPageLinkOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getActiveStyleLabel = () => {
    if (!editor) return 'Normal Text'
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1'
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2'
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3'
    if (editor.isActive('blockquote')) return 'Quote'
    if (editor.isActive('codeBlock')) return 'Code Block'
    return 'Normal Text'
  }

  // Handle file drop/paste
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          if (maxImageBytes && file.size > maxImageBytes) {
            onImageError?.('Image is too large. Choose one under 5 MB.')
            return
          }
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
  }, [editor, maxImageBytes, onImageError])
  
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (blob) {
          if (maxImageBytes && blob.size > maxImageBytes) {
            onImageError?.('Image is too large. Choose one under 5 MB.')
            return
          }
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
  }, [editor, maxImageBytes, onImageError])
  
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
          if (maxImageBytes && file.size > maxImageBytes) {
            onImageError?.('Image is too large. Choose one under 5 MB.')
            return
          }
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

  const handleCompactLink = () => {
    const entered = window.prompt('Paste a link URL', editor.getAttributes('link').href || '')
    if (entered === null) return
    if (!entered.trim()) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const url = /^[a-z]+:/i.test(entered.trim()) ? entered.trim() : `https://${entered.trim()}`
    try {
      if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error('Invalid link')
    } catch {
      window.alert('Enter a valid http or https link.')
      return
    }
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] }).run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const handlePinSelection = () => {
    const { from, to, empty } = editor.state.selection
    const text = empty ? '' : editor.state.doc.textBetween(from, to, ' ').trim()
    if (!text) {
      window.alert('Select text in the page content to pin it.')
      return
    }
    onPinSelection?.(text)
  }

  const openPageLinkPicker = () => {
    const { from, to } = editor.state.selection
    pageLinkSelectionRef.current = { from, to }
    setPageLinkSearch('')
    setPinNewPageLink(false)
    setPageLinkOpen(value => !value)
  }

  const insertPageLink = page => {
    const { from, to } = pageLinkSelectionRef.current || editor.state.selection
    const href = `https://project-minion.local/page/${page.id}`
    if (from !== to) {
      editor.chain().focus().setTextSelection({ from, to }).setLink({ href }).run()
    } else {
      editor.chain().focus().insertContentAt(from, { type: 'text', text: page.title, marks: [{ type: 'link', attrs: { href } }] }).run()
    }
    if (pinNewPageLink) onPinPageLink?.(page)
    setPageLinkOpen(false)
  }

  if (!editor) return null

  return (
    <div className={compact ? 'flex flex-col' : 'h-full flex flex-col'}>
      {/* Toolbar */}
      {showToolbar && !compact && (
        <div className="flex-none px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1 flex-wrap">
        {/* History Controls */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Text Style Dropdown */}
        <div className="relative" ref={styleDropdownRef}>
          <button
            onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Text Style"
          >
            <span>{getActiveStyleLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {isStyleDropdownOpen && (
            <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  editor.chain().focus().setParagraph().run()
                  setIsStyleDropdownOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  editor.isActive('paragraph') && !editor.isActive('blockquote') && !editor.isActive('codeBlock')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Normal Text
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                  setIsStyleDropdownOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 text-sm font-bold transition-colors ${
                  editor.isActive('heading', { level: 1 })
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Heading 1
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                  setIsStyleDropdownOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 text-sm font-semibold transition-colors ${
                  editor.isActive('heading', { level: 2 })
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Heading 2
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                  setIsStyleDropdownOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 text-sm font-medium transition-colors ${
                  editor.isActive('heading', { level: 3 })
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Heading 3
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
              <button
                onClick={() => {
                  editor.chain().focus().toggleBlockquote().run()
                  setIsStyleDropdownOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 text-sm italic transition-colors ${
                  editor.isActive('blockquote')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Blockquote
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleCodeBlock().run()
                  setIsStyleDropdownOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 text-sm font-mono transition-colors ${
                  editor.isActive('codeBlock')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Code Block
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Text Styles */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bold')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('italic')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('underline')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('strike')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('highlight')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
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
          <List className="w-4 h-4" />
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
          <ListOrdered className="w-4 h-4" />
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
          <Quote className="w-4 h-4" />
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
          <Code className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Links and pinned excerpts */}
        <button
          onClick={handleCompactLink}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('link')
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        {onPinSelection && <button type="button" onClick={handlePinSelection} className="rounded p-1.5 text-gray-700 transition-colors hover:bg-gray-200" title="Pin selected text"><Pin className="h-4 w-4" /></button>}
        {pageLinkOptions.length > 0 && <div className="relative" ref={pageLinkRef}>
          <button type="button" onClick={openPageLinkPicker} className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200" title="Link another page"><FileText className="h-4 w-4" /> Link page</button>
          {pageLinkOpen && <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <input autoFocus value={pageLinkSearch} onChange={event => setPageLinkSearch(event.target.value)} placeholder="Search pages" className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-indigo-400" />
            <div className="no-scrollbar mt-1 max-h-48 overflow-y-auto">
              {pageLinkOptions.filter(page => page.title.toLowerCase().includes(pageLinkSearch.toLowerCase())).slice(0, 20).map(page => <button key={page.id} type="button" onClick={() => insertPageLink(page)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"><FileText className="h-3.5 w-3.5 flex-none" /><span className="truncate">{page.title}</span></button>)}
              {!pageLinkOptions.some(page => page.title.toLowerCase().includes(pageLinkSearch.toLowerCase())) && <p className="px-2 py-3 text-xs text-slate-500">No matching pages</p>}
            </div>
            <label className="mt-1 flex cursor-pointer items-center gap-2 border-t border-slate-100 px-2 pt-2 text-xs text-slate-600"><input type="checkbox" checked={pinNewPageLink} onChange={event => setPinNewPageLink(event.target.checked)} className="accent-indigo-600" /> Pin this page link</label>
          </div>}
        </div>}

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

        {/* Table Operations */}
        <div className="relative" ref={tableDropdownRef}>
          <button
            onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('table')
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Table Actions"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {isTableDropdownOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
              {!editor.isActive('table') ? (
                <button
                  onClick={() => {
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                    setIsTableDropdownOpen(false)
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <TableIcon className="w-4 h-4 opacity-60" />
                  <span>Insert Table (3x3)</span>
                </button>
              ) : (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Columns
                  </div>
                  <button
                    onClick={() => {
                      editor.chain().focus().addColumnBefore().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Add Column Left
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().addColumnAfter().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Add Column Right
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().deleteColumn().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete Column
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Rows
                  </div>
                  <button
                    onClick={() => {
                      editor.chain().focus().addRowBefore().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Add Row Above
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().addRowAfter().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Add Row Below
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().deleteRow().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete Row
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Merge / Split
                  </div>
                  <button
                    onClick={() => {
                      editor.chain().focus().mergeCells().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Merge Cells
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().splitCell().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Split Cell
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <button
                    onClick={() => {
                      editor.chain().focus().toggleHeaderRow().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Toggle Header Row
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().deleteTable().run()
                      setIsTableDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                  >
                    Delete Table
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Save button */}
        {onSave && (
          <button
            onClick={onSave}
            className="px-5 py-2 text-sm font-medium rounded-full transition-colors bg-todoist-red hover:bg-todoist-red-hover text-white"
          >
            Save
          </button>
        )}
      </div>
      )}

      {!compact && pinnedItems.length > 0 && (
        <div className="no-scrollbar mx-6 mt-4 mb-1 max-h-36 flex-none space-y-2 overflow-y-auto" aria-label="Pinned page content">
          {pinnedItems.map(item => (
            <div key={item.id} className="group flex items-start gap-2 rounded-r-lg border-l-2 border-indigo-400 bg-indigo-50/60 px-3 py-2 text-sm text-slate-700">
              <Pin className="mt-0.5 h-3.5 w-3.5 flex-none text-indigo-500" aria-hidden="true" />
              {item.kind === 'page' ? (
                <button type="button" onClick={() => onOpenPageLink?.(item.linked_page_id)} className="min-w-0 flex-1 text-left font-medium text-indigo-700 hover:underline">{item.displayText}</button>
              ) : (
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{item.displayText}</span>
              )}
              <button type="button" onClick={() => onUnpin?.(item)} disabled={pinBusy} className="grid h-5 w-5 flex-none place-items-center rounded text-slate-400 opacity-60 hover:bg-indigo-100 hover:text-slate-700 hover:opacity-100 focus-visible:opacity-100 disabled:opacity-30" title="Unpin" aria-label={`Unpin ${item.displayText}`}><span aria-hidden="true">×</span></button>
            </div>
          ))}
        </div>
      )}
      {/* Editor */}
      <div
        className={compact ? 'relative max-h-52 overflow-y-auto' : 'relative flex-1 overflow-y-auto'}
        style={hideScrollbar ? {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        } : {}}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
      >
        {hideScrollbar && (
          <style>{`
            div[class*="overflow-y-auto"]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        )}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('bold')
                  ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('italic')
                  ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('underline')
                  ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('strike')
                  ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('highlight')
                  ? 'text-yellow-600 dark:text-yellow-400 bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            <button
              onClick={handleCompactLink}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('link')
                  ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              title="Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </BubbleMenu>
        )}
        {compact && !content?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() && !/<img\b/i.test(content || '') && <span className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400">Write an update…</span>}
        <EditorContent
          editor={editor}
          onClickCapture={event => {
            const link = event.target.closest?.('a[href]')
            const match = link?.getAttribute('href')?.match(/^https:\/\/project-minion\.local\/page\/(\d+)$/)
            if (match && onOpenPageLink) {
              event.preventDefault()
              onOpenPageLink(Number(match[1]))
            }
          }}
          className={compact ? 'prose prose-sm max-w-none px-4 py-2.5 text-slate-800 [&_.ProseMirror]:min-h-[28px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-0.5 [&_.ProseMirror_a]:text-indigo-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg' : `prose prose-sm dark:prose-invert max-w-none p-6 focus:outline-none min-h-[200px] h-full
            prose-p:my-3 prose-p:leading-relaxed prose-p:text-gray-800 prose-p:dark:text-gray-200
            prose-headings:my-4 prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:dark:text-gray-100 prose-headings:tracking-tight
            prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-gray-200
            prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200
            prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-2 prose-h3:pb-1 prose-h3:border-b prose-h3:border-gray-200
            prose-ul:my-3 prose-ul:list-disc prose-ul:space-y-2 prose-ul:text-gray-800 prose-ul:dark:text-gray-200
            prose-ol:my-3 prose-ol:list-decimal prose-ol:space-y-2 prose-ol:text-gray-800 prose-ol:dark:text-gray-200
            prose-li:my-1 prose-li:leading-relaxed prose-li:text-gray-800 prose-li:dark:text-gray-200
            prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:bg-gray-50 prose-blockquote:py-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
            prose-blockquote:text-gray-700 prose-blockquote:dark:text-gray-300
            prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-gray-800 prose-code:dark:text-gray-200
            prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-pre:p-4 prose-pre:rounded-lg prose-pre:text-sm prose-pre:font-mono prose-pre:leading-relaxed
            prose-img:max-w-full prose-img:rounded-lg prose-img:shadow-md
            prose-hr:my-6 prose-hr:border-t prose-hr:border-gray-200 prose-hr:dark:border-gray-700
            prose-strong:font-semibold prose-strong:text-gray-900 prose-strong:dark:text-gray-100
            prose-em:italic prose-em:text-gray-700 prose-em:dark:text-gray-300
            prose-a:text-blue-600 prose-a:hover:text-blue-700 prose-a:underline prose-a:dark:text-blue-400
            [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:h-full [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-gray-800 [&_.ProseMirror]:dark:text-gray-200
            [&_.ProseMirror]:leading-relaxed [&_.ProseMirror]:font-sans
            [&_.ProseMirror_p]:my-3 [&_.ProseMirror_p]:leading-relaxed
            [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h1]:pb-2 [&_.ProseMirror_h1]:border-b [&_.ProseMirror_h1]:border-gray-200
            [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:pb-2 [&_.ProseMirror_h2]:border-b [&_.ProseMirror_h2]:border-gray-200
            [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:pb-1 [&_.ProseMirror_h3]:border-b [&_.ProseMirror_h3]:border-gray-200
            [&_.resizable-image-container]:relative [&_.resizable-image-container]:inline-block
            [&_.resize-handle]:absolute [&_.resize-handle]:w-3 [&_.resize-handle]:h-3 [&_.resize-handle]:bg-white [&_.resize-handle]:border-2 [&_.resize-handle]:border-blue-500 [&_.resize-handle]:rounded [&_.resize-handle]:opacity-0 [&_.resize-handle]:hover:opacity-100 [&_.resize-handle]:transition-opacity [&_.resize-handle]:z-10
            [&_.resize-handle-se]:bottom-[-6px] [&_.resize-handle-se]:right-[-6px] [&_.resize-handle-se]:cursor-se-resize
            [&_.resize-handle-sw]:bottom-[-6px] [&_.resize-handle-sw]:left-[-6px] [&_.resize-handle-sw]:cursor-sw-resize
            [&_.resize-handle-ne]:top-[-6px] [&_.resize-handle-ne]:right-[-6px] [&_.resize-handle-ne]:cursor-ne-resize
            [&_.resize-handle-nw]:top-[-6px] [&_.resize-handle-nw]:left-[-6px] [&_.resize-handle-nw]:cursor-nw-resize
            [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800/50 [&_mark]:rounded [&_mark]:px-0.5`}
        />
        {/* Drop zone indicator */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 transition-opacity">
          <div className="bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-lg p-8">
            <p className="text-blue-600 font-medium">Drop images here</p>
          </div>
        </div>
      </div>
      {showToolbar && compact && (
        <div className="flex flex-none items-center gap-1 border-t border-slate-200 px-2 py-1.5">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${editor.isActive('bold') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Bold" aria-label="Bold"><Bold className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${editor.isActive('italic') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Italic" aria-label="Italic"><Italic className="h-4 w-4" /></button>
          <button type="button" onClick={handleCompactLink} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-indigo-700" title="Add link" aria-label="Add link"><LinkIcon className="h-4 w-4" /></button>
          <button type="button" onClick={handleFileSelect} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-indigo-700" title="Add image" aria-label="Add image"><ImagePlus className="h-4 w-4" /></button>
          <span className="ml-2 text-[11px] text-slate-400">Paste or drop images, or paste a link</span>
        </div>
      )}
    </div>
  )
}

export default TipTapEditor
