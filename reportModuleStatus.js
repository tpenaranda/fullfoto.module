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

  return await fetch(`${localApiUrl}/modules`, { signal: AbortSignal.timeout(ms('20s')), body: JSON.stringify(data), method: 'POST', headers: baseHeaders })
}

const run = async () => {
  try {
    const { status } = await reportModuleStatus()

    if (status === 200) {
      await sleep('15m')
    }
  } catch (e) {
    bugsnagNotify(e)
  } finally {
    const now = new Date()
    console.info(`${now.toGMTString()} | reportModuleStatus() Done.`)
    await sleep('1m')
    process.exit()
  }
}

run()
