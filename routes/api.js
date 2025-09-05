const express = require('express');
const router = express.Router();
const joi = require("joi");
const { existsSync, writeFileSync, createReadStream, statSync, readdirSync, copyFileSync, unlinkSync } = require('fs');
const { notify } = require('../utils/bugsnag');
const fetch = require('node-fetch');
const diskSpace = require('check-disk-space').default
const os = require('os')
const drivelist = require('drivelist');
const readdir = require('@folder/readdir');
const { createFolderIfDoesNotExists, mainApiUrl, storeData, baseHeaders, moduleData, getConnectedPrinters } = require('../utils/generic')
const ms = require('ms')
const Queue = require('better-queue');

router.get('/ping', async (req, res, next) => {
  const data = {
    ...moduleData,
    type: 'module',
    printers: await getConnectedPrinters(),
  }

  return res.json({ data });
});

router.all('*', async (req, res, next) => res.status(404).json({ message: 'not_found' }))

module.exports = router;
