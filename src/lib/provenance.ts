// Minimal replayer for arewehuman provenance files (.prov.json), format
// version 1: https://github.com/magland/arewehuman/blob/main/SPEC.md
//
// Events are ["s", t] | ["i", t, pos, n, src] | ["d", t, pos, n] |
// ["r", t, pos, kind, ranges]. Every inserted character gets the next integer
// id. Only characters that survive into the final text have known values;
// the rest are shown as placeholders.

type Ev = [string, number, ...unknown[]]

export interface ProvDoc {
  t0: number
  text: string
  events: Ev[]
}

function decodeRanges(r: number[]): number[] {
  const ids: number[] = []
  for (let k = 0; k + 1 < r.length; k += 2)
    for (let j = 0; j < r[k + 1]; j++) ids.push(r[k] + j)
  return ids
}

interface State {
  live: number[] // ids in document order
  next: number // next id to assign
}

function apply(st: State, ev: Ev) {
  if (ev[0] === 'i') {
    const [, , pos, n] = ev as [string, number, number, number]
    const ids: number[] = []
    for (let j = 0; j < n; j++) ids.push(st.next++)
    st.live.splice(pos, 0, ...ids)
  } else if (ev[0] === 'd') {
    const [, , pos, n] = ev as [string, number, number, number]
    st.live.splice(pos, n)
  } else if (ev[0] === 'r') {
    const [, , pos, , ranges] = ev as [string, number, number, string, number[]]
    st.live.splice(pos, 0, ...decodeRanges(ranges))
  }
}

// Caret position just after an event, or -1.
function caretAfter(ev: Ev | undefined): number {
  if (!ev) return -1
  if (ev[0] === 'i') return (ev[2] as number) + (ev[3] as number)
  if (ev[0] === 'd') return ev[2] as number
  if (ev[0] === 'r') return (ev[2] as number) + decodeRanges(ev[4] as number[]).length
  return -1
}

export class Timeline {
  private snaps: { k: number; live: number[]; next: number }[] = []
  private finalIndex = new Map<number, number>() // id -> index in final text

  constructor(readonly doc: ProvDoc) {
    const st: State = { live: [], next: 0 }
    this.snaps.push({ k: 0, live: [], next: 0 })
    doc.events.forEach((ev, i) => {
      apply(st, ev)
      if ((i + 1) % 500 === 0) this.snaps.push({ k: i + 1, live: st.live.slice(), next: st.next })
    })
    if (st.live.length !== doc.text.length) throw new Error('Provenance does not replay to its text')
    st.live.forEach((id, i) => this.finalIndex.set(id, i))
  }

  // The document after the first k events, as runs of known text and of
  // placeholders for text that was later deleted, plus the caret position.
  stateAt(k: number): { runs: { text: string; ghost: boolean }[]; caret: number } {
    let s = this.snaps[0]
    for (const x of this.snaps) if (x.k <= k) s = x
    const st: State = { live: s.live.slice(), next: s.next }
    for (let i = s.k; i < k; i++) apply(st, this.doc.events[i])
    const runs: { text: string; ghost: boolean }[] = []
    for (const id of st.live) {
      const fi = this.finalIndex.get(id)
      const ghost = fi === undefined
      const ch = ghost ? '░' : this.doc.text[fi]
      const last = runs[runs.length - 1]
      if (last && last.ghost === ghost) last.text += ch
      else runs.push({ text: ch, ghost })
    }
    return { runs, caret: caretAfter(this.doc.events[k - 1]) }
  }
}
