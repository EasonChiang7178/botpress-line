import LRU from 'lru-cache'


import { getOrFetchUserProfile } from '../users'
import { fetchContent } from '../content'
import { EVENT,MESSAGE } from '../../LINE/constants'
//const path = require('path');

const messagesCache = LRU({
  max: 10000,
  maxAge: 60 * 60 * 1000
})

export default function setupEventHandler(bp, line) {
  const preprocessor = preprocessEvent.bind(null, bp, line)

  line.on(EVENT.MESSAGE, (e, channelId) => {
    preprocessor(e).then(profile => {
      var handleResponse = new Object();
        handleResponse.platform =  'LINE';
        handleResponse.channelId =  channelId;
        handleResponse.type= EVENT.MESSAGE;
        handleResponse.user= profile;
        handleResponse.text= EVENT.MESSAGE;
        handleResponse.raw= e;      
      
      switch (e.message.type) {    
        case MESSAGE.TEXT:  
             handleResponse.text= e.message.text;
             console.log(handleResponse);
             bp.middlewares.sendIncoming(handleResponse); //sendIncoming
             break;
        case MESSAGE.IMAGE:          
          handleImage(e, bp, line).then(img=>{            
              handleResponse.type= MESSAGE.IMAGE;
              handleResponse.text= img;
              console.log(handleResponse.type);
              bp.middlewares.sendIncoming(handleResponse); //sendIncoming
          }).catch(function(err){
              console.log(err);
          }); // handleImage  
          break;
        //TODO: Agregar handler para otros messag object
        }
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

function handleImage(event, bp, line) {  
  var tmp_img_dir = process.env.TEMP_IMG_DIR;
  //const downloadPath = path.join(tmp_img_dir, `${message.id}.jpg`);  
  const downloadPath = tmp_img_dir+'/'+`${event.message.id}.jpg`;  
  return fetchContent(bp, event.message.id, line, downloadPath);
}

