const express = require('express');
const router = express.Router();

const { moduleData, getConnectedPrinters, getConnectedCamera } = require('../utils/generic')

router.get('/ping', async (req, res, next) => {
  const data = {
    ...moduleData,
    type: 'module',
    printers: await getConnectedPrinters(),
    camera: await getConnectedCamera(),
  }

  return res.json({ data });
})

router.all('*', async (req, res, next) => {
  return res.status(404).json({ message: 'not_found' })
})

module.exports = router;
