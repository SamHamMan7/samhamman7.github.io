import {pathToFileURL} from 'node:url';
import path from 'node:path';
const [source, modules, output] = process.argv.slice(2);
if (!source || !modules || !output) throw Error('Usage: node build-browser.mjs SOURCE_DIR NODE_MODULES_DIR OUTPUT_DIR');
const {build} = await import(pathToFileURL(path.join(modules,'esbuild/lib/main.js')));
await build({entryPoints:{main:path.join(source,'src/showdown-main.js'),'engine.worker':path.join(source,'src/engine.worker.js'),'ai.worker':path.join(source,'src/ai.worker.js')},bundle:true,outdir:output,nodePaths:[modules],format:'esm',platform:'browser',conditions:['onnxruntime-web-use-extern-wasm'],target:'chrome120',minify:true,sourcemap:false,external:['/sprites/*'],define:{global:'globalThis'},logLevel:'warning'});
