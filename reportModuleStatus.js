const fetch = require('node-fetch');
const os = require('os');
const ms = require('ms');
const { createReadStream, statSync, readdirSync } = require('fs');
const { notify: bugsnagNotify } = require('./utils/bugsnag');
const { baseHeaders, sleep, storeData, localApiUrl, moduleData, getConnectedPrinters } = require('./utils/generic');

const reportModuleStatus = async () => {
  const data = {
    ...moduleData,
    type: 'module',
    printers: await getConnectedPrinters(),
    network_interfaces: os.networkInterfaces(),
  }

  const response = await fetch(`${localApiUrl}/modules`, { signal: AbortSignal.timeout(ms('10s')), body: JSON.stringify(data), method: 'POST', headers: baseHeaders })
  const jsonData = await response.json()

  return jsonData
}

const run = async () => {
  try {
    await reportModuleStatus()
  } catch (e) {
    bugsnagNotify(e)
  } finally {
    const now = new Date()
    console.info(`${now.toGMTString()} | reportModuleStatus() Done.`)
    await sleep('2m')
    process.exit()
  }
}

run()
