import { readFileToString, readFileToArrayBuffer } from '../utils/index'

const ctx: Worker = self as any;

ctx.onmessage = async (e) => {
  console.log(e.data)
  const res = await readFileToString(e.data)
  ctx.postMessage(res)
}