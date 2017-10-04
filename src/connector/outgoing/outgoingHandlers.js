import { ACTION } from '../../LINE/constants'

const eventHandlerMapper = {
  [ACTION.TEXT]: handleText,
  [ACTION.TEMPLATE_BUTTONS]: handleTemplateButtons,
  [ACTION.TEMPLATE_CONFIRM]: handleTemplateConfirm,
  [ACTION.TEMPLATE_CAROUSEL]: handleTemplateCarousel,
  [ACTION.TEMPLATE_IMAGE_CAROUSEL]: handleTemplateImageCarousel
}
export default eventHandlerMapper

function handleText(event, next, lines) {
  if (event.platform !== 'LINE' || event.type !== ACTION.TEXT) {
    return next()
  }

  const to = event.raw.to
  const text = event.text
  const raw = event.raw

  return _handlePromise(
    event,
    next,
    lines[event.channelId].sendTextMessage(to, text, raw)
  )
}

function handleTemplateButtons(event, next, lines) {
  if (event.platform !== 'LINE' || event.type !== ACTION.TEMPLATE_BUTTONS) {
    return next()
  }

  const to = event.raw.to
  const text = event.raw.message.template.text
  const altText = event.raw.message.altText
  const actions = event.raw.message.template.actions
  const raw = event.raw

  return _handlePromise(
    event,
    next,
    lines[event.channelId].sendButtonMessage(to, text, altText, actions, raw)
  )
}

function handleTemplateConfirm(event, next, lines) {
  if (event.platform !== 'LINE' || event.type !== ACTION.TEMPLATE_CONFIRM) {
    return next()
  }

  const to = event.raw.to
  const text = event.raw.message.template.text
  const altText = event.raw.message.altText
  const actions = event.raw.message.template.actions
  const raw = event.raw

  return _handlePromise(
    event,
    next,
    lines[event.channelId].sendConfirmMessage(to, text, altText, actions, raw)
  )
}

function handleTemplateCarousel(event, next, lines) {
  if (event.platform !== 'LINE' || event.type !== ACTION.TEMPLATE_CAROUSEL) {
    return next()
  }

  const to = event.raw.to
  const altText = event.raw.message.altText
  const columns = event.raw.message.template.columns
  const raw = event.raw

  return _handlePromise(
    event,
    next,
    lines[event.channelId].sendCarouselMessage(to, altText, columns, raw)
  )
}

function handleTemplateImageCarousel(event, next, lines) {
  if (
    event.platform !== 'LINE' ||
    event.type !== ACTION.TEMPLATE_IMAGE_CAROUSEL
  ) {
    return next()
  }

  const to = event.raw.to
  const altText = event.raw.message.altText
  const columns = event.raw.message.template.columns
  const raw = event.raw

  return _handlePromise(
    event,
    next,
    lines[event.channelId].sendImageCarouselMessage(to, altText, columns, raw)
  )
}

function _handlePromise(event, next, promise) {
  return promise
    .then(res => {
      next()
      event._resolve && event._resolve()
      return res
    })
    .catch(err => {
      next(err)
      event._reject && event._reject(err)
      throw err
    })
}
