import { build } from "bun"

const isWatch = process.argv.includes("--watch")

const config = {
  entrypoints: [".opencode/plugin/index.ts"],
  outdir: ".opencode/plugin",
  target: "node",
  format: "esm",
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ["@opencode-ai/plugin"],
  loader: {
    ".mdx": "text",
  },
}

if (isWatch) {
  console.log("Watching for changes...")
  process.exit(0)
}

await build(config)
console.log("Build complete!")
