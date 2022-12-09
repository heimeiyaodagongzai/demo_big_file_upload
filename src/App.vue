<template>
  <div class="test">
    
    <div>{{ msg }}</div>
    <input type="file" @change="onChange">
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { doUploadBigFile, msg } from './utils';
// import { getFileMD5 } from './utils/wasm'
// import TestWorker from './worker/index.worker?worker'

// const worker = new TestWorker()
// worker.postMessage(123123)

async function onChange(e: any) {
  if (!e.target.files.length) return
  // const _md5 = await getFileMD5(e.target.files![0])
  // console.log(_md5)
  doUploadBigFile({ file: e.target.files![0], needFullFileMD5: false, sampleDataSize: 1024 ** 2, sampleSliceNum: 16 })
}

</script>

<style lang="less" scoped>
.test {
  font-size: 15px;
}
</style>