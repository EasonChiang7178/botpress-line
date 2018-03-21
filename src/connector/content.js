const fs = require('fs');


export const fetchContent = async (bp, messageId, line, downloadPath) => {
  // get content from LINE server
  return line.getMessageContent(messageId)
   .then(buffer => JSON.stringify(buffer));   
}