require('dotenv').config()
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userController = {
  register: async function (req, res) {
    const verifyEmailInDB = await User.findOne({ email: req.body.email })

    if (verifyEmailInDB) { return res.status(400).send({ "message": "Email already registered" }) }

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
    const verifyEmailInDB = await User.findOne({ email: req.body.email })

    if (!verifyEmailInDB) { return res.status(400).send({ "message": "Email or Password incorrect" }) }

    const verifyPassword = bcrypt.compareSync(req.body.password, verifyEmailInDB.password)
    if (!verifyPassword) { return res.status(400).send({ "message": "Email or Password incorrect" }) }

    const authToken = jwt.sign({ id: verifyEmailInDB._id, email: verifyEmailInDB.email }, process.env.SECRET)
    res.send({ "url": "/chats", "message": "Login successful", "authToken": authToken })
  },

  checkToken: async function (req, res) {
    const token = req.headers.authorization

    try {
      const verifiedToken = jwt.verify(token, process.env.SECRET)

      const userSelected = await User.findOne({ email: verifiedToken.email })
      if (!userSelected) { return res.status(401).send({ "canAcess": false, "message": "access denied", "url": "/login" }) } // Caso o token seja falso / não tenha nenhum usuario no banco de dados com essas infos

      res.send({ "canAcess": true, "message": "access granted" })
    } catch (error) {
      res.status(401).send({ "canAcess": false, "message": "access denied", "url": "/login" }) // Caso o token seja falso / não tenha nenhum usuario no banco de dados com essas infos
    }
  },

  verifyNewUser: async function (req, res) {
    const token = req.headers.authorization

    try {
      const verifiedToken = jwt.verify(token, process.env.SECRET)

      const userSelected = await User.findOne({ email: verifiedToken.email })

      res.send({ "role": userSelected.role })
    } catch (error) {

    }
  },

  updateUsername: async function (req, res) {
    const token = req.headers.authorization

    try {
      const verifiedToken = jwt.verify(token, process.env.SECRET)

      // const userSelected = await User.findOne({email: verifiedToken.email})
      
      const updateLog = await User.updateOne(
        { "email": verifiedToken.email },
        { $set: { "username": req.body.username, "role": "user" } }
      )
      
      console.log(updateLog)

      if (updateLog.modifiedCount === 0) {
        return res.status(404).send({ "message": "User not found or username not updated" });
      }

      res.send({ "message": "Username updated", "url": "/chats"})
    } catch (error) {

    }
  }
}

module.exports = userController