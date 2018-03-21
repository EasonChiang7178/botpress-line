import bodyParser from 'body-parser'
import { EVENT, MESSAGE, LINE_VERIFY } from '../../LINE/constants'

export default function setupWebhook(router, line) {
  const channelId = line.getConfig().channelId

  setupLINESignatureValidation(router, line, channelId)
  setupLINEWebhookListener(router, line, channelId)
}

function setupLINESignatureValidation(router, line, channelId) {
  router.use(
    `/${channelId}`,
    bodyParser.json({
      verify: line.verifyRequestSignature,
      type: req => {
        const contentType = req.headers['content-type'] || 'text'
        if (/^application\/json/.test(contentType)) {
          return true
        } else {
          throw new Error(`Type ${contentType} is not allowed`)
        }
      }
    })
  )
}

function setupLINEWebhookListener(router, line, channelId) {
  router.post(`/${channelId}/webhook`, (req, res) => {
    const data = req.body
    line.handleRawWebhookEvent(data)

    data.events.forEach(event => {
      if (
        event.source.userId === LINE_VERIFY.USER_ID &&
        (event.replyToken === LINE_VERIFY.REPLY_TOKEN_A ||
          event.replyToken === LINE_VERIFY.REPLY_TOKEN_B)
      ) {
        line.handleVerifyEvent(event)
      } else if (
        event.type === EVENT.MESSAGE &&
        event.message.type === MESSAGE.TEXT
      ) {
        line.handleMessageEvent(event)
      } else if (
        event.type === EVENT.MESSAGE &&
        (event.message.type === MESSAGE.IMAGE ||
          event.message.type === MESSAGE.VIDEO ||
          event.message.type === MESSAGE.AUDIO ||
          event.message.type === MESSAGE.FILE)
      ) {
         line.handleAttachmentEvent(event)
      } else if (
        event.type === EVENT.MESSAGE &&
        event.message.type === MESSAGE.LOCATION
      ) {
        line.handleLocationEvent(event)
      } else if (
        event.type === EVENT.MESSAGE &&
        event.message.type === MESSAGE.STICKER
      ) {
        // line.handleStickEvent(event)
      } else if (event.type === EVENT.FOLLOW) {
        line.handleFollowEvent(event)
      } else if (event.type === EVENT.UNFOLLOW) {
        line.handleUnfollowEvent(event)
      } else if (event.type === EVENT.POSTBACK) {
        line.handlePostbackEvent(event)
      } else {
        console.log('Webhook received unknown event: ', event)
      }
    })
    res.sendStatus(200)
  })
}
