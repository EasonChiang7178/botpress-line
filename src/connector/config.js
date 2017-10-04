import path from 'path'
import fs from 'fs'
import configTemplate from 'raw!../botpress-line.config.yml'

const configFileName = 'botpress-line.config.yml'

export const lineConfigs = {
  hostname: { type: 'string', default: '' },
  channelId: {
    type: 'string',
    required: true,
    default: '',
    env: 'LINE_CHANNEL_ID'
  },
  channelAccessToken: {
    type: 'string',
    required: true,
    default: '',
    env: 'LINE_CHANNEL_ACCESS_TOKEN'
  },
  channelSecret: {
    type: 'string',
    required: true,
    default: '',
    env: 'LINE_CHANNEL_SECRET'
  },
  enabled: { type: 'bool', required: true, default: true },
  additionalWebhooks: {
    type: 'any',
    default: {},
    validation: v => {
      if (typeof v !== 'object') {
        return false
      }
      return Object.keys(v).every(channelId => {
        const botConfig = v[channelId]
        return (
          typeof botConfig.channelSecret === 'string' &&
          botConfig.channelSecret.length > 0 &&
          typeof botConfig.channelAccessToken === 'string' &&
          botConfig.channelAccessToken.length > 0 &&
          typeof botConfig.enabled === 'boolean'
        )
      })
    }
  }
}
export default lineConfigs

export function isConfigFileExist(bp) {
  const filePath = path.join(bp.projectLocation, configFileName)
  return fs.existsSync(filePath)
}

export function createConfigFile(bp) {
  const filePath = path.join(bp.projectLocation, configFileName)
  fs.writeFileSync(filePath, configTemplate)
  bp.notifications.send({
    level: 'info',
    message: configTemplate + ' has been created, fill it'
  })
}

export async function loadWebhookConfigs(configurator) {
  const config = await configurator.loadAll()

  const webhookConfigList = []
  webhookConfigList.push({
    channelId: config.channelId,
    channelAccessToken: config.channelAccessToken,
    channelSecret: config.channelSecret,
    enabled: config.enabled
  })

  Object.keys(config.additionalWebhooks).forEach(channelId => {
    const webhookConfig = config.additionalWebhooks[channelId]
    webhookConfigList.push({
      channelId: channelId,
      channelAccessToken: webhookConfig.channelAccessToken,
      channelSecret: webhookConfig.channelSecret,
      enabled: webhookConfig.enabled
    })
  })

  return webhookConfigList
}
