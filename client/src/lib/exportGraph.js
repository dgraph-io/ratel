/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Serializes the GraphParser datasets to a plain JSON structure.
 *
 * Edge source/target may be either uid strings or node objects (the
 * renderer resolves them to objects in place), so both shapes are
 * handled. Node objects contain a Set and back-references, which JSON
 * cannot represent — only the meaningful fields are exported.
 */
export function graphToJSON(nodesMap, edgesMap) {
  const endpointUid = (endpoint) =>
    endpoint && typeof endpoint === 'object' ? endpoint.id : endpoint

  const nodes = []
  if (nodesMap) {
    nodesMap.forEach((node) =>
      nodes.push({
        uid: node.uid || node.id,
        label: node.name || node.label || '',
        group: node.group,
        attrs: (node.properties && node.properties.attrs) || {},
        facets: (node.properties && node.properties.facets) || {},
      }),
    )
  }

  const edges = []
  if (edgesMap) {
    edgesMap.forEach((edge) =>
      edges.push({
        source: endpointUid(edge.source),
        target: endpointUid(edge.target),
        predicate: edge.predicate,
        facets: edge.facets || {},
      }),
    )
  }

  return { nodes, edges }
}

// Composites every canvas inside container (in DOM order) onto a single
// white-backed canvas, so layered renderers export as one image.
export function compositeCanvases(container) {
  const canvases = Array.from(container.querySelectorAll('canvas'))
  if (!canvases.length) {
    return null
  }

  const width = Math.max(...canvases.map((c) => c.width))
  const height = Math.max(...canvases.map((c) => c.height))
  if (!width || !height) {
    return null
  }

  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const ctx = out.getContext('2d')
  if (!ctx) {
    return null
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  canvases.forEach((c) => ctx.drawImage(c, 0, 0, width, height))
  return out
}

export function exportFileName(extension, now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join('-')
  const time = [pad(now.getHours()), pad(now.getMinutes())].join('')
  return `ratel-graph-${stamp}-${time}.${extension}`
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadJSON(nodesMap, edgesMap) {
  const json = JSON.stringify(graphToJSON(nodesMap, edgesMap), null, 2)
  downloadBlob(
    new Blob([json], { type: 'application/json' }),
    exportFileName('json'),
  )
}

export function downloadPNG(container) {
  const canvas = compositeCanvases(container)
  if (!canvas) {
    return false
  }
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, exportFileName('png'))
    }
  }, 'image/png')
  return true
}
