import SparkMD5 from 'spark-md5'

const ctx: Worker = self as any;

const sparkMd5 = new SparkMD5()

ctx.onmessage = (e) => {
  const { type, data } = e.data
  if (type === 'append') {
    sparkMd5.append(data)
    ctx.postMessage({ type: 'next' })
  } else if (type === 'end') {
    ctx.postMessage({ type: 'end', md5: sparkMd5.end() })
    sparkMd5.destroy()
  }
}