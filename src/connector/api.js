import { getAllUsers } from './users'

export default function registerAPI(bp, configurator, lines) {
  const router = bp.getRouter('botpress-line')

  setupGetConfigAPI(router, lines)
  setupUpdateConfigAPI(router, configurator, lines)
  setupGetUsersAPI(router, bp)
}

function setupGetConfigAPI(router, lines) {
  router.get('/config', (req, res) => {
    const lineWebhookConfigs = Object.keys(lines).map(channelId =>
      lines[channelId].getConfig()
    )
    res.send(lineWebhookConfigs)
  })
}

function setupUpdateConfigAPI(router, configurator, lines) {
  router.post('/config', (req, res) => {
    const configs = req.body
    configs.forEach(config => lines[config.channelId].setConfig(config))
    // layout updated configs to the format defined in config.js
    const leadingConfig = configs.splice(0, 1)
    const configBundle = {
      channelId: leadingConfig.channelId || '',
      channelAccessToken: leadingConfig.channelAccessToken || '',
      channelSecret: leadingConfig.channelSecret || '',
      enabled: leadingConfig.enabled || true,
      additionalWebhooks: configs.reduce((resultBundle, config) => {
        const { channelId, ...configWithoutID } = config
        resultBundle[channelId] = configWithoutID
        return resultBundle
      }, {})
    }
    configurator
      .saveAll(configBundle)
      .then(() => res.sendStatus(200))
      .catch(err => {
        res.status(500).send({ message: err.message })
      })
  })
}

function setupGetUsersAPI(router, bp) {
  router.get('/users', (req, res) => {
    getAllUsers(bp)
      .then(lineUsers => {
        res.send(lineUsers)
      })
      .catch(err => res.status.send(500).send({ message: err.message }))
  })
}
