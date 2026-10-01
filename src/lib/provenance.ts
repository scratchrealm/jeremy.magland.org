// Minimal replayer for arewehuman recordings (<name>.md.awh.jsonl), format
// version 2: https://github.com/magland/arewehuman/blob/main/SPEC.md
//
// The file has one JSON value per line: a header, then events and checkpoint
// objects, and last an object with the recorded text.
//
// Events are ["s", t] | ["i", t, pos, n, src] | ["d", t, pos, n] |
// ["r", t, pos, kind, ranges]. Every inserted character gets the next integer
// id and keeps the source of its insert ("t" typed, "p" pasted, ...). Only
// characters that survive into the final text have known values; the rest are
// shown as placeholders, except for line breaks, which an insert lists (as
// offsets into the inserted text) in an optional sixth element.

type Ev = [string, number, ...unknown[]]

export interface ProvDoc {
  t0: number
  text: string
  events: Ev[]
}

// Reads a recording. Checkpoints are skipped: the hash chain is for verifiers.
export function parseRecording(s: string): ProvDoc {
  const lines = s.split('\n').filter((l) => l.trim())
  const head = JSON.parse(lines[0] ?? 'null')
  if (head?.format !== 'arewehuman' || head.version !== 2) throw new Error('Not an arewehuman recording (format version 2)')
  const final = JSON.parse(lines[lines.length - 1])
  if (typeof final?.text !== 'string') throw new Error('The recording has no final line with the text')
  const events = lines.slice(1, -1).map((l) => JSON.parse(l)).filter((v): v is Ev => Array.isArray(v))
  return { t0: head.t0, text: final.text, events }
}

const UNTYPED = new Set(['p', 'x', 'o'])

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

export interface Run {
  text: string
  ghost: boolean // later deleted; text is placeholders
  untyped: boolean // pasted, imported, or inserted without a keystroke
}

// The number of characters an insert ("i") or a move from another file ("k") adds.
const inserted = (ev: Ev) => (ev[0] === 'i' ? (ev[3] as number) : ev[0] === 'k' ? decodeRanges(ev[4] as number[]).length : 0)

function apply(st: State, ev: Ev) {
  if (ev[0] === 'i' || ev[0] === 'k') {
    const pos = ev[2] as number
    const ids: number[] = []
    for (let j = 0, n = inserted(ev); j < n; j++) ids.push(st.next++)
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
  if (ev[0] === 'i' || ev[0] === 'k') return (ev[2] as number) + inserted(ev)
  if (ev[0] === 'd') return ev[2] as number
  if (ev[0] === 'r') return (ev[2] as number) + decodeRanges(ev[4] as number[]).length
  return -1
}

export class Timeline {
  private snaps: { k: number; live: number[]; next: number }[] = []
  private finalIndex = new Map<number, number>() // id -> index in final text
  private untyped: boolean[] = [] // by id
  private lineBreak: boolean[] = [] // by id

  constructor(readonly doc: ProvDoc) {
    const st: State = { live: [], next: 0 }
    this.snaps.push({ k: 0, live: [], next: 0 })
    doc.events.forEach((ev, i) => {
      // Copies within the document ("c") count as typed, as in arewehuman.
      // Text moved from another file ("k") is shown like typed text, as in arewehuman.
      if (ev[0] === 'i' || ev[0] === 'k') {
        const breaks = new Set((ev[5] as number[] | undefined) ?? [])
        for (let j = 0, n = inserted(ev); j < n; j++) {
          this.untyped.push(ev[0] === 'i' && UNTYPED.has(ev[4] as string))
          this.lineBreak.push(breaks.has(j))
        }
      }
      apply(st, ev)
      if ((i + 1) % 500 === 0) this.snaps.push({ k: i + 1, live: st.live.slice(), next: st.next })
    })
    if (st.live.length !== doc.text.length) throw new Error('Provenance does not replay to its text')
    st.live.forEach((id, i) => this.finalIndex.set(id, i))
  }

  // The document after the first k events, as runs of known text and of
  // placeholders for text that was later deleted, plus the caret position.
  stateAt(k: number): { runs: Run[]; caret: number } {
    let s = this.snaps[0]
    for (const x of this.snaps) if (x.k <= k) s = x
    const st: State = { live: s.live.slice(), next: s.next }
    for (let i = s.k; i < k; i++) apply(st, this.doc.events[i])
    const runs: Run[] = []
    for (const id of st.live) {
      const fi = this.finalIndex.get(id)
      const ghost = fi === undefined
      const untyped = this.untyped[id]
      const ch = ghost ? (this.lineBreak[id] ? '\n' : '░') : this.doc.text[fi]
      const last = runs[runs.length - 1]
      if (last && last.ghost === ghost && last.untyped === untyped) last.text += ch
      else runs.push({ text: ch, ghost, untyped })
    }
    return { runs, caret: caretAfter(this.doc.events[k - 1]) }
  }
}
