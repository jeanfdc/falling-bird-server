const moongose = require('mongoose')

const userSchema = new moongose.Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  privacyTerms: {type: String, required: true},
  receiveNews: {type: String, default: false},
  role: {type: String, default: "newUser"},
  username: {type: String, default: ""}
})

module.exports = moongose.model('User', userSchema)