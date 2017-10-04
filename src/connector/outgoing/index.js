import outgoingHandlers from './outgoingHandlers'

export default function registerOutgoingMiddleware(bp, lines) {
  bp.middlewares.register({
    name: 'line.sendMessages',
    type: 'outgoing',
    order: 100,
    handler: outgoingMiddleware.bind(null, lines),
    module: 'botpress-line',
    description:
      'Sends out messages that targets platform = LINE.' +
      ' This middleware should be placed at the end as it swallows events once sent.'
  })
}

function outgoingMiddleware(lines, event, next) {
  if (event.platform !== 'LINE') {
    return next()
  }
  if (!outgoingHandlers[event.type]) {
    return next('Unsupported event type: ' + event.type)
  }

  outgoingHandlers[event.type](event, next, lines)
}
