import checkVersion from 'botpress-version-manager'

import lineConfigs, {
  isConfigFileExist,
  createConfigFile
} from './connector/config'
import registerOutgoingMiddleware from './connector/outgoing'
import registerUMM from './connector/umm'
import registerAPI from './connector/api'
import * as initialize from './initializer'

const lines = {}

export const config = lineConfigs

export const init = bp => {
  checkVersion(bp, __dirname)
  if (isConfigFileExist(bp) !== true) {
    createConfigFile(bp)
  }
  registerOutgoingMiddleware(bp, lines)
  registerUMM(bp)
}

export const ready = async (bp, configurator) => {
  await initialize.LINEs(bp, lines, configurator)
  registerAPI(bp, configurator, lines)
}
