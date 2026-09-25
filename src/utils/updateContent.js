const allowedTags = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI',
  'BLOCKQUOTE', 'PRE', 'CODE', 'H1', 'H2', 'H3', 'A', 'IMG'
])
const discardTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'FORM'])

export function hasUpdateContent(html) {
  if (!html) return false
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return Boolean(doc.body.textContent?.trim() || doc.body.querySelector('img'))
}

export function sanitizeUpdateHtml(html) {
  const parsed = new DOMParser().parseFromString(html || '', 'text/html')
  const safe = document.implementation.createHTMLDocument('')

  const copyNode = node => {
    if (node.nodeType === Node.TEXT_NODE) return safe.createTextNode(node.textContent || '')
    if (node.nodeType !== Node.ELEMENT_NODE || discardTags.has(node.tagName)) return null

    if (!allowedTags.has(node.tagName)) {
      const fragment = safe.createDocumentFragment()
      node.childNodes.forEach(child => {
        const cleaned = copyNode(child)
        if (cleaned) fragment.appendChild(cleaned)
      })
      return fragment
    }

    const element = safe.createElement(node.tagName.toLowerCase())
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || ''
      if (/^(https?:|mailto:)/i.test(href)) {
        element.setAttribute('href', href)
        element.setAttribute('target', '_blank')
        element.setAttribute('rel', 'noopener noreferrer')
      }
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || ''
      if (!/^(https?:|data:image\/(png|jpeg|gif|webp);base64,)/i.test(src)) return null
      element.setAttribute('src', src)
      element.setAttribute('alt', node.getAttribute('alt') || 'Update image')
      // The editor stores resized image width in its style attribute. Preserve only
      // a validated width value, never arbitrary styles from saved HTML.
      const styleWidth = (node.getAttribute('style') || '').match(/(?:^|;)\s*width\s*:\s*([^;]+)/i)?.[1]?.trim()
      const width = styleWidth || node.getAttribute('width') || ''
      const pixels = width.match(/^(\d+(?:\.\d+)?)px$/i)
      const percent = width.match(/^(\d+(?:\.\d+)?)%$/)
      if (pixels && Number(pixels[1]) >= 50 && Number(pixels[1]) <= 2000) {
        element.style.width = `${Number(pixels[1])}px`
      } else if (percent && Number(percent[1]) > 0 && Number(percent[1]) <= 100) {
        element.style.width = `${Number(percent[1])}%`
      } else if (/^\d+$/.test(width) && Number(width) >= 50 && Number(width) <= 2000) {
        element.style.width = `${Number(width)}px`
      }
      element.style.maxWidth = '100%'
      element.style.height = 'auto'
    }
    node.childNodes.forEach(child => {
      const cleaned = copyNode(child)
      if (cleaned) element.appendChild(cleaned)
    })
    return element
  }

  parsed.body.childNodes.forEach(node => {
    const cleaned = copyNode(node)
    if (cleaned) safe.body.appendChild(cleaned)
  })
  return safe.body.innerHTML
}
