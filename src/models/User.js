const moongose = require('mongoose')

const userSchema = new moongose.Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  privacyTerms: {type: String, required: true},
  receiveNews: {type: String, default: "off"}
})

module.exports = moongose.model('User', userSchema)