import SparkMD5 from 'spark-md5'

const ctx: Worker = self as any;

const sparkMd5 = new SparkMD5.ArrayBuffer()

ctx.onmessage = (e) => {
  const { type, data } = e.data
  switch (type) {
    case 'append':
      sparkMd5.append(data)
      ctx.postMessage({ type: 'next' })
      break;
    case 'end':
      ctx.postMessage({ type: 'end', md5: sparkMd5.end() })
      sparkMd5.destroy()
      break
    case 'reset':
      sparkMd5.reset()
      break
  }
}