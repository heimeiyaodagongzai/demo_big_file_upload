import { md5 } from 'hash-wasm'

export async function getFileMD5(file: File) {
  const buffer = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file.slice(0, 1024 ** 2 * (2048 - 200)))
    reader.onload = (res) => {
      console.log('file onload', res)
      resolve(new Uint8Array(res!.target!.result as ArrayBuffer))
    }
  })
  console.time()
  const res = await md5(buffer)
  console.timeEnd()
  return res
}