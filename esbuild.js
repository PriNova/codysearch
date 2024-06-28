const esbuild = require('esbuild')

const production = process.argv.includes('--production')
const watch = process.argv.includes('--watch')

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started')
    })
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`)
        console.error(`    ${location.file}:${location.line}:${location.column}:`)
      })
      console.log('[watch] build finished')
    })
  }
}

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outdir: 'dist',
    external: ['vscode'],
    logLevel: 'info',
    loader: { '.ts': 'ts', '.tsx': 'tsx' },
    define: {
      'process.env.NODE_ENV': watch ? '"development"' : '"production"'
    },
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin
    ]
  })

  // Webview bundle
  const webviewCtx = await esbuild.context({
    entryPoints: ['src/features/node-editor/index.tsx'],
    bundle: true,
    format: 'esm',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outdir: 'dist/webview',
    logLevel: 'info',
    loader: { '.ts': 'ts', '.tsx': 'tsx' },
    define: {
      'process.env.NODE_ENV': watch ? '"development"' : '"production"'
    },
    plugins: [esbuildProblemMatcherPlugin]
  })
  if (watch) {
    await ctx.watch()
    await webviewCtx.watch()
  } else {
    await ctx.rebuild()
    await webviewCtx.rebuild()
    await ctx.dispose()
    await webviewCtx.dispose()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})