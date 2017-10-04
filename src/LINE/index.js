import EventEmitter from 'eventemitter2'
import fetch from 'node-fetch'
import crypto from 'crypto'

import * as URL from './urls'
import { EVENT, MESSAGE, LINE_VERIFY } from './constants'

export default class LINE extends EventEmitter {
  constructor(config) {
    super()
    if (!config) {
      throw new Error('You need to specify config for webhook of LINE')
    }
    this.config = {}

    this.setConfig = this.setConfig.bind(this)
    this.getConfig = this.getConfig.bind(this)
    this.getConfigErrors = this.getConfigErrors.bind(this)

    this.sendTextMessage = this.sendTextMessage.bind(this)
    this.sendButtonMessage = this.sendButtonMessage.bind(this)
    this.sendConfirmMessage = this.sendConfirmMessage.bind(this)
    this.sendCarouselMessage = this.sendCarouselMessage.bind(this)
    this.sendImageCarouselMessage = this.sendImageCarouselMessage.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.getUserProfile = this.getUserProfile.bind(this)
    this.verifyRequestSignature = this.verifyRequestSignature.bind(this)

    this.handleMessageEvent = this.handleMessageEvent.bind(this)
    // this.handleAttachmentEvent = this.handleAttachmentEvent.bind(this)
    this.handleLocationEvent = this.handleLocationEvent.bind(this)
    this.handleFollowEvent = this.handleFollowEvent.bind(this)
    this.handleUnfollowEvent = this.handleUnfollowEvent.bind(this)
    this.handlePostbackEvent = this.handlePostbackEvent.bind(this)
    this.handleRawWebhookEvent = this.handleRawWebhookEvent.bind(this)
    this.handleVerifyEvent = this.handleVerifyEvent.bind(this)

    this._authHeader = this._authHeader.bind(this)
    this._post = this._post.bind(this)
    this._typingWaiting = this._typingWaiting.bind(this)
    this._handleEvent = this._handleEvent.bind(this)
    this._handleErrorResponse = this._handleErrorResponse.bind(this)
    this._autoTimeout = this._autoTimeout.bind(this)

    this.setConfig(config)
  }

  setConfig(config) {
    this.config = { ...this.config, ...config }
  }
  getConfig() {
    return this.config
  }
  getConfigErrors() {
    const errors = []
    const required = ['channelId', 'channelAccessToken', 'channelSecret']

    Object.keys(this.config).forEach(key => {
      if (
        required.indexOf(key) >= 0 &&
        (typeof this.config[key] !== 'string' || this.config[key].length <= 0)
      ) {
        errors.push({
          key: key,
          message: `Configuration is incomplete, ${key} needs to be defined. See "./botpress-line.config.yml".`
        })
      }
    })
    return errors
  }

  sendTextMessage(targetId, texts, options = null) {
    const messages =
      typeof texts === 'string'
        ? [{ type: MESSAGE.TEXT, text: texts }]
        : texts.map(text => ({ type: MESSAGE.TEXT, text }))
    return this.sendMessage(targetId, messages, options)
  }

  sendButtonMessage(targetId, text, altText, actions, options = null) {
    const { thumbnailImageUrl, title, otherOptions } = options
    const messageObj = [
      {
        type: 'template',
        altText: altText,
        template: {
          type: MESSAGE.TEMPLATE.BUTTONS,
          ...(thumbnailImageUrl && { thumbnailImageUrl }),
          ...(thumbnailImageUrl && { title }),
          text,
          actions
        }
      }
    ]
    return this.sendMessage(targetId, messageObj, otherOptions)
  }

  sendConfirmMessage(targetId, text, altText, actions, options = null) {
    const messageObj = [
      {
        type: 'template',
        altText: altText,
        template: {
          type: MESSAGE.TEMPLATE.CONFIRM,
          text,
          actions
        }
      }
    ]
    return this.sendMessage(targetId, messageObj, options)
  }

  sendCarouselMessage(targetId, altText, columns, options = null) {
    const messageObj = [
      {
        type: 'template',
        altText: altText,
        template: {
          type: MESSAGE.TEMPLATE.CAROUSEL,
          columns
        }
      }
    ]
    return this.sendMessage(targetId, messageObj, options)
  }

  sendImageCarouselMessage(targetId, altText, columns, options = null) {
    const messageObj = [
      {
        type: 'template',
        altText: altText,
        template: {
          type: MESSAGE.TEMPLATE.IMAGE_CAROUSEL,
          columns
        }
      }
    ]
    return this.sendMessage(targetId, messageObj, options)
  }

  sendMessage(targetId, messages, options) {
    const req = () =>
      this._post({
        to: targetId,
        messages
      })

    if (options && options.typing) {
      const timeout =
        typeof options.typing === 'number'
          ? options.typing
          : this._autoTimeout(messages)
      return this._typingWaiting(timeout).then(req)
    } else {
      return req()
    }
  }

  getUserProfile(userId) {
    const url = URL.profile(userId)
    return fetch(url, { headers: this._authHeader() })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err =>
        console.log(`Error getting user:${userId} profile: ${err}`)
      )
  }

  verifyRequestSignature(req, res, buf) {
    if (!/^\/webhook/i.test(req.path)) {
      throw new Error('Path not allowed')
    }

    const signature = req.headers['x-line-signature']
    if (!signature) {
      throw new Error('Couldn\'t validate the request signature.')
    } else {
      var expectedHash = crypto
        .createHmac('SHA256', this.config.channelSecret)
        .update(buf)
        .digest('base64')

      if (signature != expectedHash) {
        throw new Error('Couldn\'t validate the request signature.')
      }
    }
  }

  handleMessageEvent(event) {
    const text = event.message.text
    if (!text) {
      return
    }
    this._handleEvent(EVENT.MESSAGE, event)
  }
  handleLocationEvent(event) {
    const type = event.type
    const { title, latitude, longitude } = event.message
    if (type !== EVENT.MESSAGE || !title || !latitude || !longitude) {
      return
    }
    this._handleEvent(EVENT.LOCATION, event)
  }
  handleFollowEvent(event) {
    if (event.type !== EVENT.FOLLOW) {
      return
    }
    this._handleEvent(EVENT.FOLLOW, event)
  }
  handleUnfollowEvent(event) {
    if (event.type !== EVENT.UNFOLLOW) {
      return
    }
    this._handleEvent(EVENT.UNFOLLOW, event)
  }
  handlePostbackEvent(event) {
    if (
      event.type !== EVENT.POSTBACK ||
      !event.postback ||
      !event.postback.data
    ) {
      return
    }
    this._handleEvent(EVENT.POSTBACK, event)
  }
  handleRawWebhookEvent(event) {
    if (!event) {
      return
    }
    this._handleEvent(EVENT.RAW_WEBHOOK, event)
  }
  handleVerifyEvent(event) {
    if (
      this.config.verified ||
      !(
        event.source.userId === LINE_VERIFY.USER_ID &&
        (event.replyToken === LINE_VERIFY.REPLY_TOKEN_A ||
          event.replyToken === LINE_VERIFY.REPLY_TOKEN_B)
      )
    ) {
      return
    }
    this.setConfig({ verified: true })
  }

  _authHeader() {
    return { Authorization: `Bearer ${this.config.channelAccessToken}` }
  }

  _post(body) {
    return fetch(URL.push, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this._authHeader()
      },
      body: JSON.stringify(body)
    })
      .then(this._handleErrorResponse)
      .then(res => res.json())
      .then(json => {
        this._handleEvent(EVENT.RAW_REQUEST, {
          url: URL.push,
          token: this.config.channelAccessToken,
          body,
          method: 'POST',
          response: json
        })
        return json
      })
  }

  _typingWaiting(milliseconds) {
    let timeout = !milliseconds || isNaN(milliseconds) ? 0 : milliseconds
    timeout = Math.min(20000, timeout)

    if (milliseconds === true) {
      timeout = 1000
    }
    return _delay(timeout)

    function _delay(milliseconds) {
      return new Promise(resolve => {
        setTimeout(() => resolve(), milliseconds)
      })
    }
  }

  _handleEvent(type, event) {
    this.emit(type, event, this.config.channelId)
  }

  _handleErrorResponse(res) {
    if (!res) {
      return
    }
    if (res.status < 400) {
      return res
    }

    let errorMessage = 'An error has been returned by LINE Message API.'
    errorMessage += '\nStatus: ' + res.status + ' (' + res.statusText + ')'

    return Promise.resolve(true)
      .then(() => res.json())
      .then(json => {
        errorMessage += '\n' + json.message
      })
      .finally(() => {
        throw new Error(errorMessage)
      })
  }

  _autoTimeout(messages) {
    return messages
      ? 1000
      : messages.reduce((result, message) => {
        switch (message.type) {
        case MESSAGE.TEXT:
          return result + _textAutoTimeout(message)
        case MESSAGE.TEMPLATE:
          switch (message.template.type) {
          case MESSAGE.TEMPLATE.BUTTONS:
            return result + _buttonsAutoTimeout(message)
          case MESSAGE.TEMPLATE.CONFIRM:
            return result + _confirmAutoTimeout(message)
          case MESSAGE.TEMPLATE.CAROUSEL:
            return result + _carouselAutoTimeout(message)
          case MESSAGE.TEMPLATE.IMAGE_CAROUSEL:
            return result + _imageCarouselAutoTimeout(message)
          default:
            throw new Error(
              'Unknown message type for auto typing timeout!'
            )
          }
        default:
          throw new Error('Unknown message type for auto typing timeout!')
        }
      }, 0) + 500

    function _textAutoTimeout(message) {
      return message.text.length * 10
    }
    function _buttonsAutoTimeout(message) {
      return message.template.text.length + message.altText.length * 10
    }
    function _confirmAutoTimeout(message) {
      return message.altText.length * 10
    }
    function _carouselAutoTimeout(message) {
      return message.altText.length * 10
    }
    function _imageCarouselAutoTimeout(message) {
      return message.altText.length * 10
    }
  }
}
