import { MESSAGE } from '../LINE/constants'

export const validateUserId = userId => {
  if (!/U([0-9]|[a-z]){32}/.test(userId)) {
    throw new Error('Invalid userId')
  }
}

export const validateText = text => {
  if (typeof text !== 'string' || text.length > 2000) {
    throw new Error('Text must be a string less than 2000 chars.')
  }
}

export const validateTemplateAltText = altText => {
  if (typeof altText !== 'string' || altText.length > 400) {
    throw new Error('altText must be a string less than 400 chars.')
  }
}

export const validateTemplateButtons = template => {
  if (
    template.title &&
    typeof template.title !== 'string' &&
    template.title.length > 40
  ) {
    throw new Error(
      'buttons template title must be a string less than 40 chars.'
    )
  }

  if (template.title || template.thumbnailImageUrl) {
    if (typeof template.text !== 'string' || template.text.length > 60) {
      throw new Error(
        'buttons template text with title or thumbnailImage must be a string less than 60 chars.'
      )
    }
  } else {
    if (typeof template.text !== 'string' || template.text.length > 160) {
      throw new Error(
        'buttons template text must be a string less than 160 chars.'
      )
    }
  }

  if (
    Array.isArray(template.actions) === false ||
    template.actions.length > 5
  ) {
    throw new Error(
      'buttons template actions must be a array length less than 5'
    )
  }
  template.actions.forEach(action =>
    validateTemplateAction(action, MESSAGE.TEMPLATE.BUTTONS)
  )
}

export const validateTemplateConfirm = template => {
  if (typeof template.text !== 'string' || template.text.length > 240) {
    throw new Error(
      'confirm template text must be a string less than 240 chars.'
    )
  }

  if (
    Array.isArray(template.actions) === false ||
    template.actions.length !== 2
  ) {
    throw new Error(
      'confirm template actions must be a array length equal to 2'
    )
  }
  template.actions.forEach(action =>
    validateTemplateAction(action, MESSAGE.TEMPLATE.CONFIRM)
  )
}

export const validateTemplateCarousel = template => {
  if (
    Array.isArray(template.columns) === false ||
    template.columns.length > 5
  ) {
    throw new Error(
      'columns of template carousel must be a array length less than 5'
    )
  }
  if (template.type === MESSAGE.TEMPLATE.IMAGE_CAROUSEL) {
    template.columns.forEach(column =>
      validateTemplateImageCarouselCard(column)
    )
  } else {
    template.columns.forEach(column => validateTemplateCarouselCard(column))
  }
}

export const validateTemplateCarouselCard = column => {
  if (column.thumbnailImageUrl) {
    validateUrl(column.thumbnailImageUrl)
  }

  if (
    column.title &&
    typeof column.title !== 'string' &&
    column.title.length > 40
  ) {
    throw new Error(
      'title of template carousel column must be a string less than 40 chars.'
    )
  }

  if (column.title || column.thumbnailImageUrl) {
    if (typeof column.text !== 'string' || column.text.length > 60) {
      throw new Error(
        'text of template carousel column with title or thumbnailImage must be a string less than 60 chars.'
      )
    }
  } else {
    if (typeof column.text !== 'string' || column.text.length > 120) {
      throw new Error(
        'text of template carousel column must be a string less than 120 chars.'
      )
    }
  }

  if (Array.isArray(column.actions) === false || column.actions.length > 3) {
    throw new Error(
      'actions of template carousel column must be a array length less than 3.'
    )
  }
  column.actions.forEach(action =>
    validateTemplateAction(action, MESSAGE.TEMPLATE.CAROUSEL)
  )
}

export const validateTemplateImageCarouselCard = column => {
  validateUrl(column.imageUrl)
  validateTemplateAction(column.action, MESSAGE.TEMPLATE.IMAGE_CAROUSEL)
}

export const validateTemplateAction = (action, templateType) => {
  _validateActionLabel(action.label, templateType)
  switch (action.type) {
  case 'postback':
    return _validatePostbackAction(action)
  case 'message':
    return _validateMessageAction(action)
  case 'uri':
    return _validateUriAction(action)
  case 'datetimepicker':
    return _validateDateTimePickerAction(action)
  default:
    throw new Error('unknown type of template action!')
  }

  function _validatePostbackAction(action) {
    _validatePostbackData(action.data)
    const text = action.text
    if (text && typeof text === 'string' && text.length > 300) {
      throw new Error(
        'postback action text must be a string length less than 300'
      )
    }
  }
  function _validateMessageAction(action) {
    const text = action.text
    if (typeof text !== 'string' || text.length > 300) {
      throw new Error(
        'message action text must be a string length less than 300'
      )
    }
  }
  function _validateUriAction(action) {
    const uri = action.uri
    if (typeof uri !== 'string' || uri.length > 1000) {
      throw new Error('uri must be a string length less than 1000')
    }
    if (!/^(http|https|tel)/i.test(uri)) {
      throw new Error('protocol of the uri action is not allowed')
    }
  }
  function _validateDateTimePickerAction(action) {
    _validatePostbackData(action.data)
    if (!/date|time|datetime/.test(action.mode)) {
      throw new Error('unknown mode of date time picker')
    }
    _validateTimeFormat(action.mode, action.initial)
    _validateTimeFormat(action.mode, action.max)
    _validateTimeFormat(action.mode, action.min)
  }
  function _validateActionLabel(label, templateType) {
    switch (templateType) {
    case MESSAGE.TEMPLATE.IMAGE_CAROUSEL:
      if (label && typeof label === 'string' && label.length > 12) {
        throw new Error(
          'length of image_carousel action label must be less then 12 chars'
        )
      }
      break
    default:
      if (typeof label !== 'string' || label.length > 20) {
        throw new Error('length of action label must be less then 20 chars')
      }
    }
  }
  function _validatePostbackData(data) {
    if (typeof data !== 'string' && data.length > 300) {
      throw new Error('postback data must be a string length less than 300')
    }
  }
  function _validateTimeFormat(mode, dateString) {
    switch (mode) {
    case 'date': {
      const dateMillisecond = new Date(dateString).getTime()
      if (
        !/[12][019]\d\d-[01]\d-[0-3]\d/.test(dateString) ||
          !(dateMillisecond >= 631152000000) || // 1990-01-01
          !(dateMillisecond <= 4136544000000) // 2100-12-31
      ) {
        throw new Error('wrong format of datetime string')
      }
      break
    }
    case 'time':
      if (
        !/[012]\d:[0-5]\d/.test(dateString) ||
          (dateString[0] === '2' && /^\d[4-9]:\d\d$/.test(dateString))
      ) {
        throw new Error('wrong format of datetime string')
      }
      break
    case 'datetime': {
      const dateMillisecond = new Date(dateString).getTime()
      if (
        !/[12][019]\d\d-[01]\d-[0-3]\dT[012]\d:[0-5]\d/.test(dateString) ||
          !(dateMillisecond >= 631152000000) || // 1990-01-01T00:00
          !(dateMillisecond <= 4133980740000) // 2100-12-31T23:59
      ) {
        throw new Error('wrong format of datetime string')
      }
      break
    }
    default:
      throw new Error('unknown mode of date time picker')
    }
  }
}

export const validateTypingWaiting = typing => {
  if (typeof typing !== 'boolean' && typeof typing !== 'number') {
    throw new Error('Expected typing waiting to be a boolean of a number')
  }
}

export const validateAttachmentType = type => {
  if (typeof type !== 'string') {
    throw new Error('Expected attachment type to be a text')
  }

  if (['image', 'video', 'audio', 'file'].indexOf(type.toLowerCase()) < 0) {
    throw new Error('Invalid attachment type')
  }
}

export const validateUrl = url => {
  if (typeof url !== 'string') {
    throw new Error('Expected URL to be a string')
  }
  if (/^https/.test(url) === false) {
    throw new Error('Expected URL to use HTTPS')
  }
  if (url.length > 1000) {
    throw new Error('Expected length of URL to be less than 1000')
  }
}
