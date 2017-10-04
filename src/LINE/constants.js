export const EVENT = Object.freeze({
  MESSAGE: 'message',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  LOCATION: 'location',
  POSTBACK: 'postback',
  RAW_WEBHOOK: 'raw_webhook_body',
  RAW_REQUEST: 'raw_send_request'
})

export const MESSAGE = Object.freeze({
  TEXT: 'text',
  STICKER: 'sticker',
  VIDEO: 'video',
  FILE: 'file',
  AUDIO: 'audio',
  IMAGE: 'image',
  LOCATION: 'location',
  TEMPLATE: Object.freeze({
    BUTTONS: 'buttons',
    CONFIRM: 'confirm',
    CAROUSEL: 'carousel',
    IMAGE_CAROUSEL: 'image_carousel'
  })
})

export const ACTION = Object.freeze({
  TEXT: 'text',
  ATTACHMENT: 'attachment',
  TEMPLATE_BUTTONS: 'template_buttons',
  TEMPLATE_CONFIRM: 'template_confirm',
  TEMPLATE_CAROUSEL: 'template_carousel',
  TEMPLATE_IMAGE_CAROUSEL: 'template_image_carousel'
})

export const LINE_VERIFY = Object.freeze({
  USER_ID: 'Udeadbeefdeadbeefdeadbeefdeadbeef',
  REPLY_TOKEN_A: '00000000000000000000000000000000',
  REPLY_TOKEN_B: 'ffffffffffffffffffffffffffffffff'
})
