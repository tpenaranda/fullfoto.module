require('dotenv').config()

const { notify: bugsnagNotify } = require('./bugsnag');
const shell = require('shelljs');
const { existsSync, mkdirSync, chmodSync } = require('fs');
const ms = require('ms')

const getConnectedPrinters = async () => {
  const output = []

  try {
    const shellExec = shell.exec('lpstat -v')

    for (const row of shellExec.stdout.split('\n')) {
      if (!row.includes(': ')) {
        continue
      }

      const parts = row.split(': ')

      if (parts.length !== 2) {
        continue
      }

      output.push({ name: parts[0].replace('device for ', ''), location: parts[1] })
    }
  } catch (e) {
    bugsnagNotify(e)
  }

  return output
}

const sleep = async (time = '0') => {
  const delay = (typeof time === 'number') ? time : ms(time)

  return await new Promise(resolve => setTimeout(resolve, delay))
}

const createFolderIfDoesNotExists = (path, mode) => {
  if (existsSync(path)) {
    return false
  }

  mkdirSync(path, { recursive: true });

  const parts = path.split('/').filter(i => i)

  if (mode) {
    while (parts.length) {
      try {
        chmodSync(`/${parts.join('/')}`, mode)
      } catch (e) {
        //
      }

      parts.pop()
    }
  }

  return true
}

const baseHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
}

const moduleData = {
  id: process.env.MODULE_ID || null
}

const mainApiUrl = (process.env.MAIN_API_URL || 'https://api.fullfoto.com').replace(/\/$/, '')
const localApiUrl = (process.env.LOCAL_API_URL || 'https://local.fullfoto.com/api').replace(/\/$/, '')

module.exports = { sleep, createFolderIfDoesNotExists, baseHeaders, moduleData, mainApiUrl, localApiUrl, getConnectedPrinters }
