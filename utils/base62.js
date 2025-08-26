const base62 = require('base-x')('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')

const encode = (str) => {
  if (!str) {
    return str
  }
  return base62.encode(Buffer.from(str))
}

const decode = (str) => {
  try {
    return Buffer.from(base62.decode(str)).toString()
  } catch (e) {
    return null
  }
}

module.exports = { encode, decode }
