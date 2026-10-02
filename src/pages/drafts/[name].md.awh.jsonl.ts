// Serves each draft's recording (src/content/draft_posts/<name>.md.awh.jsonl)
// at /drafts/<name>.md.awh.jsonl, where the replay on the draft page fetches it.
import type { APIRoute, GetStaticPaths } from 'astro'
import { readFileSync } from 'node:fs'
import { getDrafts } from '../../lib/posts'

export const getStaticPaths = (async () =>
  (await getDrafts())
    .filter((p) => p.provenance)
    .map((p) => ({ params: { name: p.id }, props: { file: p.provenance!.file } }))) satisfies GetStaticPaths

export const GET: APIRoute = ({ props }) =>
  new Response(readFileSync(props.file as string), { headers: { 'Content-Type': 'application/jsonl' } })
