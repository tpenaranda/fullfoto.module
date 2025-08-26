require('dotenv').config()

const { moduleData, mainApiUrl } = require('./generic')
const Bugsnag = require('@bugsnag/js');
const BugsnagPluginExpress = require('@bugsnag/plugin-express')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_KEY,
  plugins: [BugsnagPluginExpress],
  enabledReleaseStages: ['production'],
  collectUserIp: false,
  appType: 'module',
  metadata: {
    module_id: moduleData.id,
  },
  redactedKeys: [
    /^pass$/i,
    /^secret$/i,
  ],
})

const getMiddleware = () => Bugsnag.getPlugin('express')

const notify = (...params) => Bugsnag.notify(...params)

module.exports = { getMiddleware, notify }
