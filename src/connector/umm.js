import util from 'util'
import _ from 'lodash'

import * as actions from './actions'
import { MESSAGE } from '../LINE/constants'

function registerUMM(bp) {
  const [umm, registerConnector] = _.at(bp, ['umm', 'umm.registerConnector'])

  umm &&
    registerConnector &&
    registerConnector({
      platform: 'LINE',
      processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
      templates: getTemplates()
    })
}
export default registerUMM

function processOutgoing({ event, blocName, instruction }) {
  ////////
  // PRE-PROCESSING
  ////////

  const optionsList = ['typing', 'on', 'thumbnailImageUrl', 'title']
  const options = _.pick(instruction, optionsList)

  /////////
  // Processing
  /////////  
  if (!_.isNil(instruction.template_type)) {        
    switch (instruction.template_type) {
    case MESSAGE.TEMPLATE.BUTTONS:
      return actions.createTemplateButtons(
        getUserId(event),
        event.channelId,
        instruction.text,
        instruction.altText,
        instruction.actions,
        options
      )
    case MESSAGE.TEMPLATE.CONFIRM:
      return actions.createTemplateConfirm(
        getUserId(event),
        event.channelId,
        instruction.text,
        instruction.altText,
        instruction.actions,
        options
      )
    case MESSAGE.TEMPLATE.CAROUSEL:
      return actions.createTemplateCarousel(
        getUserId(event),
        event.channelId,
        instruction.altText,
        instruction.columns,
        instruction.imageSize,
        instruction.imageAspectRatio,
        options
      )
    case MESSAGE.TEMPLATE.IMAGE_CAROUSEL:
      return actions.createTemplateImageCarousel(
        getUserId(event),
        event.channelId,
        instruction.altText,
        instruction.columns,
        options
      )
    default:
      break
    }
  }

  if (!_.isNil(instruction.text)) {
    return actions.createText(
      getUserId(event),
      event.channelId,
      instruction.text,
      options
    )
  }

  ////////////
  /// POST-PROCESSING
  ////////////

  // Nothing to post-process yet

  ////////////
  /// INVALID INSTRUCTION
  ////////////

  const strRep = util.inspect(instruction, false, 1)
  throw new Error(
    `Unrecognized instruction on Facebook Messenger in bloc '${blocName}': ${strRep}`
  )
}

function getUserId(event) {
  const userId =
    _.get(event, 'user.id') ||
    _.get(event, 'user.userId') ||
    _.get(event, 'userId') ||
    _.get(event, 'raw.source.userId') ||
    _.get(event, 'raw.from') ||
    _.get(event, 'raw.userId') ||
    _.get(event, 'raw.user.id')

  if (!userId) {
    throw new Error('Could not find userId in the incoming event.')
  }

  return userId
}

function getTemplates() {
  return [
    {
      type: 'Text - Single message',
      template: 'block_name_sm:\n  - Text goes here..'
    },
    {
      type: 'Text - Multiple messages',
      template:
        'block_name_mm:\n' +
        '  - Text goes here..(1)\n' +
        '  - Text goes here..(2)'
    },
    {
      type: 'Text - Random message',
      template:
        'block_name_rm:\n' +
        '  - text:\n' +
        '    - Text goes here..(1)\n' +
        '    - Text goes here..(2)'
    },
    {
      type: 'Template - Buttons',
      template:
        'block_buttons:\n' +
        '  - on: LINE\n' +
        '    template_type: buttons\n' +
        '    text: Text goes here...(1)\n' +
        '    altText: AltText goes here...(2)\n' +
        '    actions:\n' +
        '      - type: template_action_type\n' +
        '        label: Label goes here...(3)\n' +
        '        data: action=go&itemId=123\n' +
        '    thumbnailImageUrl: https://example.com/123.jpg\n' +
        '    title: Title goes here...(4)'
    },
    {
      type: 'Template - Confirm',
      template:
        'block_confirm:\n' +
        '  - on: LINE\n' +
        '    template_type: confirm\n' +
        '    text: Text goes here...(1)\n' +
        '    altText: AltText goes here...(2)\n' +
        '    actions:\n' +
        '      - type: template_action_type\n' +
        '        label: Label goes here...(3)\n' +
        '        data: action=go&itemId=123'
    },
    {
      type: 'Template - Carousel',
      template:
        'block_carousel:\n' +
        '  - on: LINE\n' +
        '    template_type: carousel\n' +
        '    altText: AltText goes here...(1)\n' +
        '    imageSize: cover\n' +
        '    imageAspectRatio: rectangle\n' +        
        '    columns:\n' +
        '      - text: Card description goes here...(2)\n' +
        '        actions:\n' +
        '          - type: card_template_action\n' +
        '            label: Label goes here...(3)\n' +
        '            data: action=go&itemId=123\n' +
        '        title: Card title goes here...(3)\n' +
        '        thumbnailImageUrl: https://example.com/123.jpg'
    },
    {
      type: 'Template - Image Carousel',
      template:
        'block_image_carousel:\n' +
        '  - on: LINE\n' +
        '    template_type: image_carousel\n' +
        '    altText: AltText goes here...(1)\n' +
        '    columns:\n' +
        '      - imageUrl: https://example.com/123.jpg\n' +
        '        action:\n' +
        '          type: card_template_action\n' +
        '          label: Label goes here...(3)\n' +
        '          data: action=go&itemId=123'
    },
    {
      type: 'Typing - Message with typing',
      template:
        'block_name_bm:\n' +
        '  - text: Text goes here..(1)\n' +
        '    typing: 1000ms'
    }
  ]
}
