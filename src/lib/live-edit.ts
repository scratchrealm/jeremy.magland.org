// Editing a post or draft on the site itself (see LiveEdit.astro, which loads
// this module only when editing starts). The post's file, and its arewehuman
// recording if it has one, are read from GitHub (not from the built site,
// which may lag behind), edited in a recording editor, and saved as one commit
// to `main`, which rebuilds the site. The whole file is edited and recorded,
// frontmatter included, as in the VS Code extension. (Recordings made before
// 2026-10-14 left the frontmatter out; the editor records it as "other" the
// first time such a post is edited.)
//
// Edits not yet saved are kept in localStorage, with the blob shas they were
// based on, and restored when the same post is edited again.
import MarkdownIt from 'markdown-it'
import { EmbeddedEditor, LocalStorageClips, joinFrontmatter, splitFrontmatter } from 'arewehuman/embed'
import { blobSha, commitFiles, ConflictError, getToken, headCommit, readFile, REPO, setToken } from './github'

const md = new MarkdownIt({ html: true, linkify: true })
const clips = new LocalStorageClips('liveEdit:clips')

interface Base {
  md: string | null // blob shas of the files as last read or saved
  rec: string | null
}

interface Draft {
  base: Base
  front?: string // in drafts kept before 2026-10-14, the frontmatter, edited apart from `body`
  body: string // the file's text
  recording: string | null
  at: number // epoch ms
}

const draftKey = (path: string) => `liveEdit:draft:${path}`

function loadDraft(path: string): Draft | null {
  try {
    return JSON.parse(localStorage.getItem(draftKey(path)) || 'null')
  } catch {
    return null
  }
}

function storeDraft(path: string, d: Draft | null) {
  try {
    if (d) localStorage.setItem(draftKey(path), JSON.stringify(d))
    else localStorage.removeItem(draftKey(path))
    return true
  } catch {
    return false
  }
}

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {}, ...kids: (Node | string)[]) => {
  const el = document.createElement(tag)
  const { class: cls, ...rest } = props
  if (cls) el.className = cls
  Object.assign(el, rest)
  el.append(...kids)
  return el
}

const downloadLink = (label: string, text: string, name: string) => {
  const a = h('a', { textContent: label, download: name })
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
  return a
}

const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

let active: { close: () => void } | null = null

// Opens the editor for the file at `path` (relative to the repository root).
export function openLiveEditor(path: string) {
  if (active) return
  const recPath = `${path}.awh.jsonl`
  const name = path.split('/').pop()!

  const status = h('span', { class: 'live-edit-status' })
  const saveBtn = h('button', { type: 'button', textContent: 'Save', disabled: true })
  const closeBtn = h('button', { type: 'button', textContent: 'Close' })
  const previewBox = h('input', { type: 'checkbox', checked: pref('preview', true) })
  const sourcesBox = h('input', { type: 'checkbox', checked: pref('sources', true) })
  const sourcesLabel = h('label', { hidden: true }, sourcesBox, ' Tint untyped')
  const tokenBtn = h('button', { type: 'button', textContent: 'Forget token', title: 'Remove the GitHub token from this browser' })
  const bar = h(
    'div',
    { class: 'live-edit-bar' },
    h('strong', { textContent: name }),
    h('span', { class: 'live-edit-rec' }),
    status,
    h('span', { class: 'live-edit-spacer' }),
    sourcesLabel,
    h('label', {}, previewBox, ' Preview'),
    tokenBtn,
    saveBtn,
    closeBtn,
  )
  const notice = h('div', { class: 'live-edit-notice', hidden: true })
  const host = h('div', { class: 'live-edit-editor' })
  const preview = h('div', { class: 'live-edit-preview prose' })
  const panes = h('div', { class: 'live-edit-panes' }, h('div', { class: 'live-edit-left' }, host), preview)
  const overlay = h('div', { class: 'live-edit', role: 'dialog', ariaLabel: `Editing ${name}` }, bar, notice, panes)
  document.body.append(overlay)
  document.documentElement.classList.add('live-editing')

  let editor: EmbeddedEditor | null = null
  let base: Base = { md: null, rec: null }
  let commit: string | null = null
  let changedSinceSave = false
  let draftTimer = 0
  let draftPending = false
  let previewTimer = 0
  let busy = false

  const setStatus = (s: string, err = false) => {
    status.textContent = s
    status.classList.toggle('live-edit-error', err)
  }
  const showNotice = (...kids: (Node | string)[]) => {
    notice.replaceChildren(...kids)
    notice.hidden = kids.length === 0
  }

  const renderPreview = () => {
    preview.hidden = !previewBox.checked
    panes.classList.toggle('live-edit-with-preview', previewBox.checked)
    // The preview shows the post as the site does, without its frontmatter.
    if (editor && previewBox.checked) preview.innerHTML = md.render(splitFrontmatter(editor.text).body)
  }
  previewBox.addEventListener('change', () => {
    setPref('preview', previewBox.checked)
    renderPreview()
  })
  sourcesBox.addEventListener('change', () => {
    setPref('sources', sourcesBox.checked)
    editor?.setShowSources(sourcesBox.checked)
  })
  tokenBtn.addEventListener('click', () => {
    if (!confirm('Remove the GitHub token from this browser? You will need to paste it again to save.')) return
    setToken(null)
    close()
  })

  const dirty = () => changedSinceSave

  const keepDraft = async () => {
    draftPending = false
    if (!editor) return
    if (!dirty()) {
      storeDraft(path, null)
      return
    }
    const ok = storeDraft(path, { base, body: editor.text, recording: await editor.recording(), at: Date.now() })
    if (!ok) setStatus('Could not keep unsaved edits in this browser (storage full?)', true)
  }

  const onChange = () => {
    changedSinceSave = true
    saveBtn.disabled = busy || !dirty()
    if (!busy) setStatus(dirty() ? 'Unsaved changes' : '')
    draftPending = true
    clearTimeout(draftTimer)
    draftTimer = window.setTimeout(keepDraft, 800)
    clearTimeout(previewTimer)
    previewTimer = window.setTimeout(renderPreview, 150)
  }

  const mount = (text: string, recording: string | null) => {
    editor?.destroy()
    editor = new EmbeddedEditor({
      parent: host,
      body: text,
      recording,
      docKey: `jeremy.magland.org:${path}`,
      clips,
      commit,
      showSources: sourcesBox.checked,
      onChange,
    })
    sourcesLabel.hidden = !editor.recorded
    bar.querySelector('.live-edit-rec')!.textContent = editor.recorded ? '● recording' : 'not recorded'
    bar.querySelector('.live-edit-rec')!.classList.toggle('live-edit-recording', editor.recorded)
    renderPreview()
    editor.focus()
  }

  const load = async (token: string, useDraft: boolean) => {
    setStatus('Loading from GitHub…')
    commit = await headCommit(token)
    const [mdFile, recFile] = await Promise.all([readFile(token, path, commit), readFile(token, recPath, commit)])
    if (!mdFile) throw new Error(`${path} is not on ${REPO} main (was it renamed or published?)`)
    base = { md: mdFile.sha, rec: recFile?.sha ?? null }
    const draft = useDraft ? loadDraft(path) : null
    if (draft && draft.base.md === base.md && draft.base.rec === base.rec) {
      mount(joinFrontmatter(draft.front ?? '', draft.body), draft.recording)
      changedSinceSave = true
      saveBtn.disabled = !dirty()
      const discard = h('button', { type: 'button', textContent: 'Discard them' })
      discard.addEventListener('click', () => {
        if (!confirm('Discard the unsaved edits and reload the post from GitHub?')) return
        storeDraft(path, null)
        showNotice()
        run(() => load(token, false))
      })
      showNotice(`Restored unsaved edits from ${time(draft.at)}. `, discard)
      setStatus(dirty() ? 'Unsaved changes' : '')
    } else {
      if (draft) {
        // Based on files that have changed since: offer them as a download rather than lose them.
        const a = downloadLink('Download them', joinFrontmatter(draft.front ?? '', draft.body), name)
        const drop = h('button', { type: 'button', textContent: 'Forget them' })
        drop.addEventListener('click', () => {
          storeDraft(path, null)
          showNotice()
        })
        showNotice(`Unsaved edits from ${time(draft.at)} were based on an older version of this post, so they were not restored. `, a, ' · ', drop)
      }
      mount(mdFile.text, recFile?.text ?? null)
      changedSinceSave = false
      saveBtn.disabled = true
      setStatus('')
    }
  }

  const save = async () => {
    const token = getToken()
    if (!editor || !token || busy || !dirty()) return
    busy = true
    saveBtn.disabled = true
    setStatus('Saving…')
    try {
      const fileText = editor.text
      const recording = editor.recorded ? await editor.recording() : null
      const files: Record<string, string> = { [path]: fileText }
      if (recording !== null) files[recPath] = recording
      const sha = await commitFiles(token, files, { [path]: base.md, [recPath]: base.rec }, `Edit ${name} on the site`)
      base = { md: await blobSha(fileText), rec: recording === null ? base.rec : await blobSha(recording) }
      commit = sha
      // Edits made while saving stay unsaved.
      changedSinceSave = editor.text !== fileText
      clearTimeout(draftTimer)
      await keepDraft()
      const link = h('a', { href: `https://github.com/${REPO}/commit/${sha}`, target: '_blank', rel: 'noopener', textContent: sha.slice(0, 7) })
      const actions = h('a', { href: `https://github.com/${REPO}/actions`, target: '_blank', rel: 'noopener', textContent: 'rebuilding' })
      status.replaceChildren(`Saved ${time(Date.now())} as `, link, '; the site is ', actions, '.')
      status.classList.remove('live-edit-error')
    } catch (e) {
      if (e instanceof ConflictError) {
        setStatus('Not saved', true)
        showNotice(
          `${e.message} Saving now would overwrite that change. `,
          downloadLink('Download your version', editor.text, name),
          ', then close and reopen the editor to load the newer one.',
        )
      } else setStatus(`Not saved: ${(e as Error).message}`, true)
    } finally {
      busy = false
      saveBtn.disabled = !dirty()
    }
  }
  saveBtn.addEventListener('click', save)

  const onKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      void save()
    }
  }
  const onUnload = (e: BeforeUnloadEvent) => {
    if (draftPending || busy) e.preventDefault()
  }
  document.addEventListener('keydown', onKey, true)
  window.addEventListener('beforeunload', onUnload)

  const close = () => {
    if (busy) return
    clearTimeout(draftTimer)
    if (draftPending) void keepDraft()
    editor?.destroy()
    overlay.remove()
    document.documentElement.classList.remove('live-editing')
    document.removeEventListener('keydown', onKey, true)
    window.removeEventListener('beforeunload', onUnload)
    active = null
  }
  closeBtn.addEventListener('click', close)
  active = { close }

  const run = (f: () => Promise<void>) =>
    f().catch((e) => {
      setStatus((e as Error).message, true)
      if (/Bad credentials|\(401\)/.test((e as Error).message)) askToken('The stored token was not accepted.')
    })

  const askToken = (why = '') => {
    const input = h('input', { type: 'password', placeholder: 'github_pat_…', autocomplete: 'off', spellcheck: false })
    const ok = h('button', { type: 'button', textContent: 'Use token' })
    const form = h(
      'div',
      { class: 'live-edit-token' },
      h('p', {}, why ? `${why} ` : '', 'Editing needs a GitHub token that can write to ', h('code', { textContent: REPO }), '. It is kept only in this browser.'),
      h(
        'ol',
        {},
        h('li', {}, 'Open ', h('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener', textContent: 'new fine-grained token' }), '.'),
        h('li', {}, 'Resource owner: scratchrealm. Repository access: only ', h('code', { textContent: 'jeremy.magland.org' }), '.'),
        h('li', {}, 'Repository permissions: Contents, read and write. Nothing else.'),
      ),
      h('p', {}, input, ' ', ok),
    )
    tokenBtn.hidden = true
    host.replaceChildren(form)
    input.focus()
    const submit = () => {
      const t = input.value.trim()
      if (!t) return
      setToken(t)
      tokenBtn.hidden = false
      host.replaceChildren()
      void run(() => load(t, true))
    }
    ok.addEventListener('click', submit)
    input.addEventListener('keydown', (e) => e.key === 'Enter' && submit())
  }

  const token = getToken()
  if (token) void run(() => load(token, true))
  else {
    preview.hidden = true
    askToken()
  }
}

function pref(k: string, d: boolean) {
  try {
    const v = localStorage.getItem(`liveEdit:${k}`)
    return v === null ? d : v === '1'
  } catch {
    return d
  }
}

function setPref(k: string, v: boolean) {
  try {
    localStorage.setItem(`liveEdit:${k}`, v ? '1' : '0')
  } catch {
    /* not remembered */
  }
}
