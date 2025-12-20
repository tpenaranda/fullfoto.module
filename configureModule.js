const { notify: bugsnagNotify } = require('./utils/bugsnag')
const { sleep, createFolderIfDoesNotExists, baseHeaders, storeData, mainApiUrl, localApiUrl } = require('./utils/generic')
const readdir = require('@folder/readdir')
const { statSync, unlinkSync, readdirSync, renameSync, copyFileSync, chmodSync } = require('fs')
const { execSync } = require('child_process');
const diskSpace = require('check-disk-space').default
const os = require('os')
const ms = require('ms')
const sharp = require('sharp');

const configureModule = async () => {
  const pingResponse = await fetch(`${localApiUrl}/stores/ping`, { signal: AbortSignal.timeout(ms('10s')), headers: baseHeaders, method: 'GET' })

  if (pingResponse.status !== 200) {
    return false
  }

  const jsonPingData = await pingResponse.json()
  const { id } = jsonPingData.data.store || {}

  if (!id) {
    return false
  }

  const response = await fetch(`${mainApiUrl}/stores/${id}`, { signal: AbortSignal.timeout(ms('10s')), headers: baseHeaders, method: 'GET' })

  if (response.status !== 200) {
    return false
  }

  const jsonData = await response.json()
  const logoResponse = await fetch(`${mainApiUrl}${jsonData.data.media_urls.logo}`, { signal: AbortSignal.timeout(ms('10s')), headers: baseHeaders, method: 'GET' })

  const logoImage = await sharp(await logoResponse.arrayBuffer())
  logoImage.resize({ width: 480 * 0.9, height: 320 * 0.9, fit: 'inside' })

  const outputImage = sharp('logo_base.png').composite([{ input: await logoImage.toBuffer(), gravity: 'centre', blend: 'over' }])

  await outputImage.toFile(`${__dirname}/../logo.png`)

  return true
}

const run = async () => {
  try {
    const now = new Date()
    console.info(`${now.toGMTString()} | configureModule() Start.`)

    const response = await configureModule()
  } catch (e) {
    bugsnagNotify(e)
    console.log(e)
  } finally {
    const now = new Date()
    console.info(`${now.toGMTString()} | configureModule() Done.`)
    process.exit()
  }
}

run()
