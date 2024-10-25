const moongose = require('mongoose')

const channelSchema = new moongose.Schema({
  channel_id: {type: Number},
  channel_type: {type: String},
  users_connected: {type: Array},
  messages: {type: Array}
})

module.exports = moongose.model('Channel', channelSchema)