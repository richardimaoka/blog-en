const production = process.env.NODE_ENV === 'production'

module.exports = {
  assetPrefix: production ? '/blog' : '',
}