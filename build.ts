Bun.build({
  entrypoints:["./src/index.ts"],
  outdir : "./dist/",
  minify : false,
  target : "node",
  external :[
    "mongoose",
    "@sinclair/typebox"
  ]
})