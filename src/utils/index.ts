import { ref } from 'vue'
import SparkMD5 from 'spark-md5'

import ReadFileWorker from '../worker/readFile?worker'
import MD5Worker from '../worker/md5?worker'

export const msg = ref('')

export type DoUploadBigFileOptions = {
  /**
   * 文件
   */
  file: File
  /**
   * 文件切片大小
   */
  fileSliceSize?: number
  /**
   * 计算MD5进度变化回调
   */
  onComputeMD5ProgressChange?: (options: { progress: number }) => void
  /**
   * 用于检查缓存的键名
   */
  checkCacheStorgeKey?: string
  /**
   * 是否需要生成完整文件的MD5，不需要就生成抽样MD5
   */
  needFullFileMD5?: boolean
  /**
   * 上传时的最大并发数，通常不要超过 5
   */
  maxConcurrentRequests?: number
  /**
   * 实际上传文件数据
   */
  doUpload?: (params: {
    file: File,
    sliceIndex: number,
    fileMD5: string
  }) => Promise<any>
}

export async function doUploadBigFile(optons: DoUploadBigFileOptions & GetFileSliceMD5Options) {
  const {
    file,
    fileSliceSize = 1024 ** 2 * 4,
    onComputeMD5ProgressChange,
    checkCacheStorgeKey = 'xxx',
    needFullFileMD5 = true,
    maxConcurrentRequests = 4,
    doUpload = () => {},
    ...rest
  } = optons

  // 切片总数
  const fileSliceTotalNum = Math.ceil(file.size / fileSliceSize)
  // // 切片文件字符串对象
  // const fileStrMap = new Map<number, string>()
  // // 读取中的索引
  // const fileInReadFileStrMap = new Set()

  if (file.size < fileSliceSize) { // 文件小于切片大小，直接计算md5并上传
    const fileStr = await readFileToString({ file })
    const _md5 = await getMD5ByFileString(fileStr)
    doUpload({ file, sliceIndex: 0, fileMD5: _md5 })
    return
  }

  const _fileSliceMD5 = await getFileSliceMD5({ file, ...rest })

  if (!needFullFileMD5) { // 生成切片MD5作为文件唯一标识
    
  }

  // console.time('读取文件切片')

  // msg.value = '开始读取文件切片'

  // let strMap: any = await readFileToStringByWorker({ file, fileSliceSize })

  // console.timeEnd('读取文件切片')
  // msg.value = '读取文件完成'
  // console.log(strMap.keys())
  
  // strMap = null

  getBigFileMD5ByWorker({ file, fileSliceSize })
}

export type GetFileSliceMD5Options = {
  /**
   * 文件
   */
  file: File
  /**
   * 采样片段数，越大越离散
   */
  sampleSliceNum?: number
  /**
   * 采样总数据量
   */
  sampleDataSize?: number
}

/**
 * 获取文件抽样MD5
 */
export async function getFileSliceMD5(options: GetFileSliceMD5Options) {
  const {
    file,
    sampleSliceNum = 4,
    sampleDataSize = 1024 ** 2 * 2,
  } = options

  const size = file.size
  const sliceSize = Math.floor(sampleDataSize / sampleSliceNum)
  const offset = Math.floor((size - sliceSize) / sampleSliceNum)

  const sliceArr = new Array(sampleSliceNum).fill({}).map((v, i) => ({ start: i * offset, end: i * offset + sliceSize }))
  const ress = await Promise.all(sliceArr.map(v => readFileToString({ file, ...v })))
  const res = await getMD5ByFileString(ress.join(''))
  return `${res}_${size}`
}

export type ReadFileToStringOptions = {
  file: File
  start?: number
  end?: number
}

/**
 * 读取文件字符串
 */
export function readFileToString(options: ReadFileToStringOptions): Promise<string> {
  const { file, start = 0, end = file.size } = options
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsBinaryString(file.slice(start, end))
    reader.onload = res => resolve(res!.target!.result as string)
  })
}

type ReadFileToArrayBufferOptions = ReadFileToStringOptions

export function readFileToArrayBuffer(options: ReadFileToArrayBufferOptions): Promise<ArrayBuffer> {
  const { file, start = 0, end = file.size } = options
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file.slice(start, end))
    reader.onload = res => resolve(res!.target!.result as ArrayBuffer)
  })
}

/**
 * 获取字符串md5
 */
export function getMD5ByFileString(str: string): Promise<string> {
  return new Promise((resolve) => {
    const sparkMd5 = new SparkMD5()
    sparkMd5.append(str)
    resolve(sparkMd5.end())
  })
}

type ReadFileToStringByWorker = {
  file: File
  fileSliceSize: number
  maxWorkerNum?: number
}

// export function readFileToStringByWorker(options: ReadFileToStringByWorker): Promise<Map<number, string>> {
//   const {
//     file,
//     fileSliceSize,
//     maxWorkerNum = 2,
//   } = options

//    // 切片总数
//    const fileSliceTotalNum = Math.ceil(file.size / fileSliceSize)
//    // 切片文件字符串对象
//    const fileStrMap = new Map<number, string>()
//    // 读取中的索引
//    const fileInReadFileStrMap = new Set()

//   const workerMap: { [x: number]: any } = {}

//   return new Promise((resolve) => {
//     for (let index = 0; index < maxWorkerNum; index++) {
//       workerMap[index] = {}
//       const item = workerMap[index]
//       const worker = new ReadFileWorker()
//       item.worker = worker
//       item.index = index
//       worker.postMessage({ file, start: item.index * fileSliceSize, end: (item.index + 1) * fileSliceSize })
  
//       worker.onmessage = (e) => {
//         fileStrMap.set(item.index, e.data)
//         fileInReadFileStrMap.delete(item.index)
//         while (true) {
//           if (item.index === fileSliceTotalNum - 1) { // 没有待读取的切片了
//             worker.terminate()
//             resolve(fileStrMap)
//             break
//           }
//           if (fileStrMap.has(item.index)) {
//             item.index++
//           }
//           if (fileInReadFileStrMap.has(item.index)) {
//             item.index++
//           } else {
//             worker.postMessage({ file, start: item.index * fileSliceSize, end: (item.index + 1) * fileSliceSize })
//             fileInReadFileStrMap.add(item.index)
//             break
//           }
//         }
//       }
//     }
//   })
// }

type GetBigFileMD5ByWorkerOptions = {
  file: File
  fileSliceSize: number
  maxWorkerNum?: number
}

export function getBigFileMD5ByWorker(options: GetBigFileMD5ByWorkerOptions) {
  const {
    file,
    fileSliceSize,
    maxWorkerNum = 2,
  } = options

  // 切片总数
  const fileSliceTotalNum = Math.ceil(file.size / fileSliceSize)
  const fileStrMap = new Map<number, string>()
  const fileSliceInfo = new Array(fileSliceTotalNum).fill(null).map((v, i) => {
    const start = i * fileSliceSize
    return { start, end: start > file.size ? file.size : start + fileSliceSize }
  })
  // 切片MD5
  const fileSliceMd5Map = new Map<number, string>()
  // 读取中的索引
  const readingFileSliceStrIndexSet = new Set<number>()

  // 内存中缓存的最大切片数量
  const maxCacheFileSliceStrNum = maxWorkerNum * 4
  // 缓存可用剩余切片数
  let reaminCacheFileSliceStrNum = maxCacheFileSliceStrNum
  let nextReadFileSliceIndex = 0

  // 当前在计算MD5的切片索引
  let currentComputedMD5Index = 0

  // 读下一片的数据
  const readNextFileSlice = () => {
    let key = '', length = maxCacheFileSliceStrNum
    Object.keys(workerMap).forEach(v => { // 往任务少的worker中分配任务
      if (!key) key = v
      const len = workerMap[v].readingList.length
      if (len < length) {
        length = len
        key = v
      }
    })
    const item = workerMap[key]

    if (reaminCacheFileSliceStrNum && nextReadFileSliceIndex !== fileSliceTotalNum - 1) { // 还能加
      readingFileSliceStrIndexSet.add(nextReadFileSliceIndex)
      item.readingList.push(nextReadFileSliceIndex)
      reaminCacheFileSliceStrNum--
      
      item.worker.postMessage({ file, ...fileSliceInfo[nextReadFileSliceIndex] })
      nextReadFileSliceIndex++
      readNextFileSlice()
    }
  }

  const workerMap: { [x: number | string]: { worker: Worker, readingList: number[] } } = {}
  ;(new Array(maxWorkerNum).fill(null).forEach((v, i) => {
    const worker = new ReadFileWorker()
    workerMap[i] = { worker, readingList: [] }
    const item = workerMap[i]
    worker.onmessage = ({ data }) => {
      console.log(`第${item.readingList[0]}片读取完成`);
      fileStrMap.set(item.readingList[0], data)
      item.readingList.splice(0, 1)
      if (!currentComputedMD5Index) computedNextMD5()
    }
  }))

  readNextFileSlice()

  console.log(workerMap)

  const md5Worker = new MD5Worker()
  // 塞下一片的数据
  function computedNextMD5() {
    md5Worker.postMessage({ type: 'append', str: fileStrMap.get(currentComputedMD5Index) })
    fileStrMap.delete(currentComputedMD5Index)
    currentComputedMD5Index++
    reaminCacheFileSliceStrNum++
    readNextFileSlice()
  }

  md5Worker.onmessage = ({ data }) => {
    if (data.type === 'next') {
      msg.value = `MD5计算到第${currentComputedMD5Index + 1}片`
      if (currentComputedMD5Index === fileSliceTotalNum - 1) {
        md5Worker.postMessage({ type: 'end' })
      } else {
        computedNextMD5()
      }
    } else if (data.type === 'end') {
      msg.value = `MD5为：${data.md5}`
      Object.keys(workerMap).forEach(v => workerMap[v].worker.terminate())
      md5Worker.terminate()
    }
  }
}