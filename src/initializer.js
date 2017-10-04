import chalk from 'chalk'

import LINE from './LINE'
import { loadWebhookConfigs } from './connector/config'
import registerIncomingHooks from './connector/incoming'

export async function LINEs(bp, lines, configurator) {
  const webhookConfigs = await loadWebhookConfigs(configurator)
  return await Promise.all(
    webhookConfigs.map(initializeLINE.bind(null, bp, lines))
  )
}

async function initializeLINE(bp, lines, config) {
  const line = (lines[config.channelId] = new LINE(config))

  const configErrors = line.getConfigErrors()
  if (configErrors.length > 0) {
    configErrors.forEach(err =>
      bp.logger.warn('[botpress-line] ' + err.message)
    )
    return bp.notifications.send({
      level: 'error',
      message: 'Error updating LINE App. Please see logs for details.'
    })
  }
  if (config.enabled === false) {
    return bp.logger.warn('[botpress-line] Connection disabled.')
  }

  try {
    registerIncomingHooks(bp, line)
    bp.notifications.send({
      level: 'success',
      message: `LINE webhook updated.\n\
                 Remember to login ${chalk.green.bold.underline(
    'https://developers.line.me/'
  )} for verifying your LINE webhook`
    })
  } catch (err) {
    bp.logger.error(err)
    return bp.notifications.send({
      level: 'error',
      message: 'Error in LINE Connector. Please see logs for details.'
    })
  }
}
