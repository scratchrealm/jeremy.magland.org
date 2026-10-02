// A post or draft without a title in its frontmatter takes its title from a
// leading "# " heading (see src/lib/posts.ts). The post page shows the title in
// its header, so the heading is removed from the rendered body.
export default function remarkPostTitle() {
  return (tree, file) => {
    if (!/[\\/]src[\\/]content[\\/](draft_)?posts[\\/]/.test(file.path ?? '')) return
    if (file.data.astro?.frontmatter?.title) return
    const first = tree.children[0]
    if (first?.type === 'heading' && first.depth === 1) tree.children.shift()
  }
}
