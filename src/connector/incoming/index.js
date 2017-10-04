import setupWebhook from './hooks'
import setupEventHandler from './handlers'

function registerIncomingHooks(bp, line) {
  const router = bp.getRouter('botpress-line', {
    'bodyParser.json': false,
    auth: req => !/\/webhook/i.test(req.originalUrl)
  })
  setupWebhook(router, line)
  setupEventHandler(bp, line)
}

export default registerIncomingHooks
