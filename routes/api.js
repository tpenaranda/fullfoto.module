const express = require('express');
const router = express.Router();
const joi = require("joi");
const { existsSync, writeFileSync, createReadStream, statSync, readdirSync, copyFileSync, unlinkSync } = require('fs');
const sharp = require('sharp');
const { notify } = require('../utils/bugsnag');
const fetch = require('node-fetch');
const shell = require('shelljs');
const diskSpace = require('check-disk-space').default
const os = require('os')
const drivelist = require('drivelist');
const readdir = require('@folder/readdir');
const { createFolderIfDoesNotExists, mainApiUrl, storeData, baseHeaders } = require('../utils/generic')
const ms = require('ms')
const Queue = require('better-queue');
const crypto = require('crypto');

const getConnectedPrinters = async () => {
  const output = []

  try {
    const shellExec = shell.exec('lpinfo -v')

    for (const row of shellExec.stdout.split('\n')) {
      if (!row.includes('usb://')) {
        continue
      }

      output.push(row.replace(/^.*usb:\/\//, '').replace(/\?.*/, '').replace('/', ' ').replace(/\+/g, ' '))
    }
  } catch (e) {
    notify(e)
  }

  try {
    const shellExec = shell.exec('lsusb')

    for (const row of shellExec.stdout.split('\n')) {
      if (!row.includes('040a:404f')) {
        continue
      }

      output.push(row.replace(/^.*040a:404f /, ''))
    }
  } catch (e) {
    notify(e)
  }

  return output
}

router.get('/ping', async (req, res, next) => {
  const data = {
    id: '',
    type: 'module',
    printers: await getConnectedPrinters(),
  }

  return res.json({ data });
});

router.post('/print', async (req, res, next) => {
  const { error } = joi.object({
    method: joi.string().valid('single', 'mosaic').default('single'),
    size: joi.string().valid('10x15', '15x20').default('15x20'),
    data: joi.array().items(joi.string()).required(),
  }).validate(req.body)

  const { data, size, method } = req.body

  if (!data || !data.length) {
    return res.status(400).json({ message: 'bad_request' })
  }

  if (size !== '15x20' || method !== 'single') {
    return res.status(400).json({ message: 'not_implemented' })
  }

  for (const base64Image of data) {
    const imageData = base64Image.replace(/^data:([A-Za-z-+/]+);base64,/, '')
    const fullFileName = `/tmp/${crypto.randomUUID()}.jpg`

    writeFileSync(fullFileName, imageData, { encoding: 'base64' })

    const requestResponse = shell.exec(`lp -d KODAK_305_Photo_Printer -o media=w432h576 ${fullFileName}`)
  }

  return res.json({ data: {} }).status(201);
});

router.all('*', async (req, res, next) => res.status(404).json({ message: 'not_found' }))

module.exports = router;
