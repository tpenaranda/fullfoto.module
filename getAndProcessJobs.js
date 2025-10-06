const fetch = require('node-fetch');
const os = require('os');
const ms = require('ms');
const { createReadStream, statSync, readdirSync } = require('fs');
const { notify: bugsnagNotify } = require('./utils/bugsnag');
const { baseHeaders, sleep, storeData, localApiUrl, moduleData, getConnectedPrinters } = require('./utils/generic');
const crypto = require('crypto');
const sharp = require('sharp');
const shell = require('shelljs');

const getAndProcessJobs = async () => {
  const response = await fetch(`${localApiUrl}/jobs`, { signal: AbortSignal.timeout(ms('10s')), method: 'GET', headers: baseHeaders })
  const jsonData = await response.json()

  if (!jsonData || !jsonData.data) {
    return false
  }

  for (const { id, data, type, status } of jsonData.data) {
    if (status !== 'created') {
      continue
    }

    if (type === 'print') {
      const { method, size, items, output, position } = data

      if (size !== '15x20' || method !== 'single' || !items || !items.length) {
        continue
      }

      for (const { url } of items) {
        if (!url) {
          continue
        }

        try {
          const urlResponse = await fetch(url)
          const imgBuffer = await urlResponse.buffer()

          const fullFileName = `/tmp/${crypto.randomUUID()}.png`

          const sharpImage = await sharp(imgBuffer)
          const { width, height, orientation } = await sharpImage.metadata()

          const isVertical = height > width

          const outputWidth = !isVertical ? width : (height * 0.75)
          const outputHeight = !isVertical ? (width * 0.75) : height

          const outputImage = sharpImage.resize({
            width: Math.round(outputWidth),
            height: Math.round(outputHeight),
            fit: sharp.fit.cover,
            position: position || sharp.strategy.entropy,
          }).png({ compressionLevel: 0 })

          await outputImage.toFile(fullFileName)

          const requestResponse = shell.exec(`lp -d ${output || 'KODAK_305_Photo_Printer'} -o media=w432h576 ${fullFileName}`)
        } catch (e) {
          bugsnagNotify(e)
        }
      }

      const patchResponse = await fetch(`${localApiUrl}/jobs/${id}`, { signal: AbortSignal.timeout(ms('10s')), body: JSON.stringify({ status: 'completed' }), method: 'PATCH', headers: baseHeaders })
    }
  }

  return true
}

const run = async () => {
  try {
    await getAndProcessJobs()
  } catch (e) {
    bugsnagNotify(e)
    await sleep('2m')
  } finally {
    const now = new Date()
    console.info(`${now.toGMTString()} | getAndProcessJobs() Done.`)
    await sleep('10s')
    process.exit()
  }
}

run()
