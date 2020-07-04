const isProduction = process.env.NODE_ENV === "production"

module.exports = {
  assetPrefix: isProduction ? '/blog' : '',
  publicRuntimeConfig: {
    basePath: isProduction ? '/blog' : ''
  }
}