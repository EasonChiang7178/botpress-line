import * as validator from '../LINE/validator'
import { ACTION, MESSAGE } from '../LINE/constants'

export const createText = (userId, channelId, text, options) => {
  validator.validateUserId(userId)
  validator.validateText(text)
  if (options && options.typing) {
    validator.validateTypingWaiting(options.typing)
  }
  return _create({
    platform: 'LINE',
    channelId: channelId,
    type: ACTION.TEXT,
    text: text,
    raw: {
      to: userId,
      message: text,
      typing: options && options.typing
    }
  })
}

export const createTemplateButtons = (
  userId,
  channelId,
  text,
  altText,
  actions,
  options = {}
) => {
  validator.validateUserId(userId)
  validator.validateTemplateAltText(altText)
  validator.validateTemplateButtons({ text, actions, ...options })

  return _create({
    platform: 'LINE',
    channelId: channelId,
    type: ACTION.TEMPLATE_BUTTONS,
    text: altText,
    raw: {
      to: userId,
      message: {
        type: 'template',
        altText,
        template: {
          type: MESSAGE.TEMPLATE.BUTTONS,
          text,
          actions
        }
      },
      ...options
    }
  })
}

export const createTemplateConfirm = (
  userId,
  channelId,
  text,
  altText,
  actions,
  options = {}
) => {
  validator.validateUserId(userId)
  validator.validateTemplateAltText(altText)
  validator.validateTemplateConfirm({ text, actions })

  return _create({
    platform: 'LINE',
    channelId: channelId,
    type: ACTION.TEMPLATE_CONFIRM,
    text: altText,
    raw: {
      to: userId,
      message: {
        type: 'template',
        altText,
        template: {
          type: MESSAGE.TEMPLATE.CONFIRM,
          text,
          actions
        }
      },
      ...options
    }
  })
}

export const createTemplateCarousel = (
  userId,
  channelId,
  altText,
  columns,
  options = {}
) => {
  validator.validateUserId(userId)
  validator.validateTemplateAltText(altText)
  validator.validateTemplateCarousel({
    type: MESSAGE.TEMPLATE.CAROUSEL,
    columns
  })

  return _create({
    platform: 'LINE',
    channelId: channelId,
    type: ACTION.TEMPLATE_CAROUSEL,
    text: altText,
    raw: {
      to: userId,
      message: {
        type: 'template',
        altText,
        template: {
          type: MESSAGE.TEMPLATE.CAROUSEL,
          columns
        }
      }
    },
    ...options
  })
}

export const createTemplateImageCarousel = (
  userId,
  channelId,
  altText,
  columns,
  options = {}
) => {
  validator.validateUserId(userId)
  validator.validateTemplateAltText(altText)
  validator.validateTemplateCarousel({
    type: MESSAGE.TEMPLATE.IMAGE_CAROUSEL,
    columns
  })

  return _create({
    platform: 'LINE',
    channelId: channelId,
    type: ACTION.TEMPLATE_IMAGE_CAROUSEL,
    text: altText,
    raw: {
      to: userId,
      message: {
        type: 'template',
        altText,
        template: {
          type: MESSAGE.TEMPLATE.IMAGE_CAROUSEL,
          columns
        }
      }
    },
    ...options
  })
}

function _create(obj) {
  let resolve = null
  let reject = null
  const promise = new Promise((r, rj) => {
    resolve = r
    reject = rj
  })

  const messageId = new Date().toISOString() + Math.random()

  const newEvent = Object.assign(
    {
      _promise: promise,
      _resolve: resolve,
      _reject: reject,
      __id: messageId
    },
    obj
  )

  return newEvent
}
