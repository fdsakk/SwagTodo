export interface LayoutInput {
  id: string
  startMin: number
  endMin: number
}

export interface LayoutResult {
  columnIndex: number
  columnCount: number
}

/**
 * Pack overlapping intervals into side-by-side columns (Google-Calendar style).
 *
 * Within a maximal cluster of mutually-reachable overlapping blocks every block
 * shares the same `columnCount`, so the rendered widths line up. Non-overlapping
 * blocks get `{ columnIndex: 0, columnCount: 1 }` — i.e. full width, preserving
 * the original single-column look.
 */
export const packColumns = (
  blocks: readonly LayoutInput[]
): Map<string, LayoutResult> => {
  const result = new Map<string, LayoutResult>()
  if (blocks.length === 0) return result

  const sorted = [...blocks].sort(
    (a, b) => a.startMin - b.startMin || b.endMin - a.endMin
  )

  // A cluster is a run of blocks where each one starts before the running max
  // end of the cluster. Column assignment is local to the cluster.
  let cluster: LayoutInput[] = []
  let clusterEnd = -Infinity

  const flush = (): void => {
    if (cluster.length === 0) return
    // Greedy: assign each block the lowest column whose last block has ended.
    const columnEnds: number[] = []
    const columnOf = new Map<string, number>()
    for (const block of cluster) {
      let col = columnEnds.findIndex((end) => end <= block.startMin)
      if (col === -1) {
        col = columnEnds.length
        columnEnds.push(block.endMin)
      } else {
        columnEnds[col] = block.endMin
      }
      columnOf.set(block.id, col)
    }
    const columnCount = columnEnds.length
    for (const block of cluster) {
      result.set(block.id, {
        columnIndex: columnOf.get(block.id) ?? 0,
        columnCount
      })
    }
    cluster = []
    clusterEnd = -Infinity
  }

  for (const block of sorted) {
    if (cluster.length > 0 && block.startMin >= clusterEnd) flush()
    cluster.push(block)
    clusterEnd = Math.max(clusterEnd, block.endMin)
  }
  flush()

  return result
}
