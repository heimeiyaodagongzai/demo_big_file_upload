import { readFileToArrayBuffer } from '../utils/index'

const ctx: Worker = self as any;

ctx.onmessage = async (e) => {
  const data = await readFileToArrayBuffer(e.data)
  ctx.postMessage({ data, index: e.data.index })
}