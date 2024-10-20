const User = require('../models/User')
const bcrypt = require('bcryptjs')

const userController = {
  register: async function (req, res) {
    const verifyEmailInDB = await User.findOne({email: req.body.email})
    
    if(verifyEmailInDB){return res.status(400).send("Email already registered")}

    const user = new User({
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password),
      privacyTerms: req.body.privacyTerms,
      receiveNews: req.body.receiveNews
    })

    try {
      const userCreated = await user.save()
      res.send(userCreated)
    } catch (error) {
      res.status(400).send(error)
    }
  },

  login: async function (req, res) {
    const verifyEmailInDB = await User.findOne({email: req.body.email})

    if(!verifyEmailInDB){return res.status(400).send("Email or password wrong")}

    const verifyPassword = bcrypt.compareSync(req.body.password, verifyEmailInDB.password)
    if(!verifyPassword){return res.status(400).send("Email or password wrong")}

    res.redirect('http://localhost:3000/chats')
  },
}

module.exports = userController