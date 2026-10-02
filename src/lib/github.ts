// The few GitHub REST calls the live editor needs (see live-edit.ts), made from
// the browser with a fine-grained personal access token. Saving puts all the
// files in one commit and moves `main` to it only if it is a fast-forward.

export const REPO = 'scratchrealm/jeremy.magland.org'
export const BRANCH = 'main'

const TOKEN_KEY = 'liveEdit:githubToken'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* the token then lasts only for this page */
  }
}

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function api<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try {
      const j = await res.json()
      if (j?.message) msg = `${j.message} (${res.status})`
    } catch {
      /* keep the status line */
    }
    throw new GitHubError(msg, res.status)
  }
  return res.json() as Promise<T>
}

const utf8 = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)))

// The commit `main` points at.
export async function headCommit(token: string): Promise<string> {
  const ref = await api<{ object: { sha: string } }>(token, 'GET', `/git/ref/heads/${BRANCH}`)
  return ref.object.sha
}

export interface RepoFile {
  sha: string // the git blob sha
  text: string
}

// A file at a commit, or null if it does not exist there.
export async function readFile(token: string, path: string, commit: string): Promise<RepoFile | null> {
  let meta: { sha: string; content?: string; encoding?: string }
  try {
    meta = await api(token, 'GET', `/contents/${encodePath(path)}?ref=${commit}`)
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null
    throw e
  }
  // The contents API leaves out files over 1 MB; the blob API has them all.
  if (meta.encoding === 'base64' && meta.content) return { sha: meta.sha, text: utf8(meta.content) }
  const blob = await api<{ content: string }>(token, 'GET', `/git/blobs/${meta.sha}`)
  return { sha: meta.sha, text: utf8(blob.content) }
}

// The git blob sha of a text, as git would compute it.
export async function blobSha(text: string): Promise<string> {
  const body = new TextEncoder().encode(text)
  const head = new TextEncoder().encode(`blob ${body.length}\0`)
  const all = new Uint8Array(head.length + body.length)
  all.set(head)
  all.set(body, head.length)
  const h = await crypto.subtle.digest('SHA-1', all)
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/')

export class ConflictError extends Error {}

// Commits `files` (path to new text) on top of `main`. `base` gives the blob
// sha each file had when editing began (null if it did not exist). If `main`
// has moved since, the commit goes on top of the new head as long as none of
// these files changed there; otherwise a ConflictError is thrown and nothing
// is written. Returns the new commit's sha.
export async function commitFiles(
  token: string,
  files: Record<string, string>,
  base: Record<string, string | null>,
  message: string,
): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const head = await headCommit(token)
    for (const path of Object.keys(files)) {
      const cur = await fileSha(token, path, head)
      if (cur !== base[path])
        throw new ConflictError(`${path} has changed on GitHub since you started editing (another commit to ${BRANCH}).`)
    }
    const commit = await api<{ tree: { sha: string } }>(token, 'GET', `/git/commits/${head}`)
    const tree = await api<{ sha: string }>(token, 'POST', '/git/trees', {
      base_tree: commit.tree.sha,
      tree: Object.entries(files).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content })),
    })
    const created = await api<{ sha: string }>(token, 'POST', '/git/commits', { message, tree: tree.sha, parents: [head] })
    try {
      await api(token, 'PATCH', `/git/refs/heads/${BRANCH}`, { sha: created.sha, force: false })
      return created.sha
    } catch (e) {
      // `main` moved between reading it and updating it: try again on the new head.
      if (e instanceof GitHubError && e.status === 422 && attempt < 2) continue
      throw e
    }
  }
}

async function fileSha(token: string, path: string, commit: string): Promise<string | null> {
  try {
    const meta = await api<{ sha: string }>(token, 'GET', `/contents/${encodePath(path)}?ref=${commit}`)
    return meta.sha
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null
    throw e
  }
}
