const os = require('os');
const ms = require('ms');
const { createReadStream, statSync, readdirSync } = require('fs');
const { notify: bugsnagNotify } = require('./utils/bugsnag');
const { baseHeaders, sleep, storeData, localApiUrl, moduleData, getConnectedPrinters } = require('./utils/generic');
const crypto = require('crypto');
const sharp = require('sharp');
const { execSync } = require('child_process');

const getAndProcessJobs = async () => {
  const response = await fetch(`${localApiUrl}/jobs`, { signal: AbortSignal.timeout(ms('12s')), method: 'GET', headers: baseHeaders })
  const jsonData = await response.json()

  if (!jsonData || !jsonData.data || !jsonData.data.length) {
    return false
  }

  const connectedPrinters = await getConnectedPrinters()

  for (const { id, data, type, status } of jsonData.data) {
    if (status !== 'created') {
      continue
    }

    if (type === 'print') {
      const { method, size, items, output, position } = data

      if (!['10x15', '15x20'].includes(size) || method !== 'single' || !items || !items.length || !connectedPrinters.map(i => i.name).includes(output)) {
        continue
      }

      execSync(`cupsaccept ${output}`)
      execSync(`cupsenable ${output}`)

      for (const { url } of items) {
        if (!url) {
          continue
        }

        try {
          const patchResponse = await fetch(`${localApiUrl}/jobs/${id}`, { signal: AbortSignal.timeout(ms('20s')), body: JSON.stringify({ status: 'in_progress' }), method: 'PATCH', headers: baseHeaders })

          if (patchResponse.status !== 200) {
            continue
          }

          const urlResponse = await fetch(url, { signal: AbortSignal.timeout(ms('12s')), method: 'GET', headers: baseHeaders })

          const sharpImage = await sharp(await urlResponse.arrayBuffer())
          const { width, height, orientation } = await sharpImage.metadata()

          const isVertical = height > width

          const aspectRatio = size.split('x').map(Number).reverse().reduce((acc, i) => i / acc, 1)

          const outputWidth = !isVertical ? width : (height * aspectRatio)
          const outputHeight = !isVertical ? (width * aspectRatio) : height

          const outputImage = sharpImage.resize({
            width: Math.round(outputWidth),
            height: Math.round(outputHeight),
            fit: sharp.fit.cover,
            position: position || sharp.strategy.entropy,
          }).png({ compressionLevel: 3 })

          const fullFileName = `/tmp/${crypto.randomUUID()}.png`
          await outputImage.toFile(fullFileName)

          if (size === '10x15') {
            execSync(`lp -d ${output} -o print-quality=5 -o media=w288h432 ${fullFileName}`)
          }

          if (size === '15x20') {
            execSync(`lp -d ${output} -o print-quality=5 -o media=w432h576 ${fullFileName}`)
          }
        } catch (e) {
          bugsnagNotify(e)
        }
      }

      await fetch(`${localApiUrl}/jobs/${id}`, { signal: AbortSignal.timeout(ms('20s')), body: JSON.stringify({ status: 'completed' }), method: 'PATCH', headers: baseHeaders })
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
  }
}

run()
