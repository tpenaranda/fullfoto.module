require('dotenv').config()

const { existsSync, mkdirSync, chmodSync } = require('fs');
const ms = require('ms')

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

const mainApiUrl = process.env.MAIN_API_URL || ''

module.exports = { sleep, createFolderIfDoesNotExists, baseHeaders, moduleData, mainApiUrl }
