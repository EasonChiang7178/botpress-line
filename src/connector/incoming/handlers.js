import LRU from 'lru-cache'

import { getOrFetchUserProfile } from '../users'
import { EVENT } from '../../LINE/constants'

const messagesCache = LRU({
  max: 10000,
  maxAge: 60 * 60 * 1000
})

export default function setupEventHandler(bp, line) {
  const preprocessor = preprocessEvent.bind(null, bp, line)

  line.on(EVENT.MESSAGE, (e, channelId) => {
    preprocessor(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'LINE',
        channelId: channelId,
        type: EVENT.MESSAGE,
        user: profile,
        text: e.message.text,
        raw: e
      })
    })
  })

  line.on(EVENT.LOCATION, (e, channelId) => {
    preprocessor(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'LINE',
        channelId: channelId,
        type: EVENT.LOCATION,
        user: profile,
        text: e.message.title,
        location: {
          address: e.message.address || '',
          latitude: e.message.latitude,
          longitude: e.message.longitude
        },
        raw: e
      })
    })
  })

  line.on(EVENT.FOLLOW, (e, channelId) => {
    preprocessor(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'LINE',
        channelId: channelId,
        type: EVENT.FOLLOW,
        user: profile,
        text: 'get_started',
        raw: e
      })
    })
  })

  line.on(EVENT.UNFOLLOW, (e, channelId) => {
    preprocessor(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'LINE',
        channelId: channelId,
        type: EVENT.UNFOLLOW,
        user: profile,
        text: 'BLOCKED_BY_USER',
        raw: e
      })
    })
  })

  line.on(EVENT.POSTBACK, (e, channelId) => {
    preprocessor(e).then(profile => {
      const datePickerParams = e.postback.params

      bp.middlewares.sendIncoming({
        platform: 'LINE',
        channelId: channelId,
        type: EVENT.POSTBACK,
        user: profile,
        text: e.postback.data,
        ...(datePickerParams && { dateTime: datePickerParams }),
        raw: e
      })
    })
  })
}

function preprocessEvent(bp, line, payload) {
  const userId = payload.source.userId
  const mid = payload.message && payload.message.id

  if (mid && messagesCache.has(mid)) {
    payload.alreadyProcessed = true
  } else {
    messagesCache.set(mid, true)
  }
  return getOrFetchUserProfile(bp, userId, line)
}
