const moongose = require('mongoose')

const userSchema = new moongose.Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  privacy_terms: {type: String, required: true},
  receive_news: {type: String, default: false},
  role: {type: String, default: "newUser"},
  username: {type: String, default: ""},
  user_id: {type: Number}
})

module.exports = moongose.model('User', userSchema)