const { DiskStore } = require('cache-manager-fs-hash');
const ms = require('ms')

const diskStore = new DiskStore({
  path: 'disk_store_cache',
  ttl: ms('30m'),
  zip: false,
  hash: true,
});

const getKey = async (key, defaultValue = undefined) => {
  const output = await diskStore.get(key)

  if (output !== undefined) {
    return output
  }

  return defaultValue
}

const setKey = async (key, value = undefined, ttl = undefined) => {
  return await diskStore.set(key, value, ttl || ms('10m'))
}

const mergeToKey = async (key, object = {}) => {
    return await setKey(key, { ...(await getKey(key) || {}), ...object })
}

module.exports = { getKey, setKey, mergeToKey }
