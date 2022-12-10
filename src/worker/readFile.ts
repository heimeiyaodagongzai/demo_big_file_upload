import { readFileToArrayBuffer } from '../utils/index'

const ctx: Worker = self as any;

let file: File | null = null

ctx.onmessage = async (e) => {
  if ('file' in e.data) {
    file = e.data.file
  } else {
    const data = await readFileToArrayBuffer({ ...e.data, file })
    ctx.postMessage({ data, index: e.data.index })
  }
}