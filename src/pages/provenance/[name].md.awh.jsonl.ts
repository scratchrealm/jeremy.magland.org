// Serves each post's recording (src/content/posts/<name>.md.awh.jsonl) at
// /provenance/<name>.md.awh.jsonl, where the replay on the post page fetches it.
import type { APIRoute, GetStaticPaths } from 'astro'
import { readFileSync } from 'node:fs'
import { getPosts } from '../../lib/posts'

export const getStaticPaths = (async () =>
  (await getPosts())
    .filter((p) => p.provenance)
    .map((p) => ({ params: { name: p.id }, props: { file: p.provenance!.file } }))) satisfies GetStaticPaths

export const GET: APIRoute = ({ props }) =>
  new Response(readFileSync(props.file as string), { headers: { 'Content-Type': 'application/jsonl' } })
