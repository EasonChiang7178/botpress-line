const apiURL = path => `https://api.line.me/v2/bot/${path}`

export const reply = apiURL('message/reply')
export const push = apiURL('message/push')
export const multicast = apiURL('message/multicast')
export const content = messageId => apiURL(`message/${messageId}/content`)
export const profile = userId => apiURL(`profile/${userId}`)
