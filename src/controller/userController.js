require('dotenv').config()
const User = require('../models/User')
const Channel = require('../models/Channel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userController = {
  register: async function (req, res) {
    const verifyEmailInDB = await User.findOne({ email: req.body.email })

    if (verifyEmailInDB) { return res.status(400).send({ "message": "Email already registered" }) }

    const user = new User({
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password),
      privacy_terms: req.body.privacy_terms,
      receive_news: req.body.receive_news,
      user_id: await User.countDocuments() + 1
    })

    try {
      const userCreated = await user.save()
      res.send({ "data": userCreated, "url": "/login" })
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

      res.send({ "message": "Username updated", "url": "/chats" })
    } catch (error) {

    }
  },

  findUser: async function (req, res) {
    // try {
    //   const userSelected = await User.findOne({"username": req.body.search})

    //   if (userSelected) {
    //     console.log(userSelected)
    //     console.log(userSelected.user_id)
    //     res.send({"found": true, "data": {"username": userSelected.username, "user_id": userSelected.user_id}})
    //   } else {
    //     res.send({"found": false})
    //   }
    // } catch (error) {
    //   console.log(error)
    // }

    try {
      const matchUsers = await User.find({ "username": { $regex: req.body.search } })
      if (matchUsers[0] != undefined) {
        let sendUsers = []

        matchUsers.map((data) => (
          sendUsers.push({ "username": data.username, "user_id": data.user_id })
        ))

        res.send({ "found": true, "data": sendUsers })
      } else {
        res.send({ "found": false })
      }
    } catch (error) {
      console.log(error)
    }
  },

  handleChannel: async function (req, res) {
    const token = req.headers.authorization

    try {
      const verifiedToken = await jwt.verify(token, process.env.SECRET)
      const senderUser = await User.findOne({ "email": verifiedToken.email })
      const receiverUser = req.body

      const checkChannel01 = await Channel.findOne({ "users_connected": [{ "username": senderUser.username, "user_id": senderUser.user_id }, { "username": receiverUser.username, "user_id": receiverUser.user_id }] })
      const checkChannel02 = await Channel.findOne({ "users_connected": [{ "username": receiverUser.username, "user_id": receiverUser.user_id }, { "username": senderUser.username, "user_id": senderUser.user_id }] })

      if (checkChannel01 || checkChannel02) {
        if (checkChannel01) {
          return res.send({ "status": "success/channel exists", "url": checkChannel01.channel_id })
        } else {
          return res.send({ "status": "success/channel exists", "url": checkChannel02.channel_id })
        }
      }

      const channel = new Channel({
        channel_id: await Channel.countDocuments() + 1,
        channel_type: "direct_message",
        users_connected: [{ "username": senderUser.username, "user_id": senderUser.user_id }, { "username": receiverUser.username, "user_id": receiverUser.user_id }],
        messages: [{ "sender": "", "message": [] }]
      })

      const createdChannel = await channel.save()

      res.send({ "status": "success/channel created", "url": createdChannel.channel_id })
    } catch (error) {

    }

    // const channel = new Channel({

    // })
  },

  verifyChatAccess: async function (req, res) {
    const token = req.headers.authorization
    const channelId = req.body.channel_id

    try {
      const verifiedToken = await jwt.verify(token, process.env.SECRET)
      const selectedUser = await User.findOne({ "email": verifiedToken.email })
      const selectedChannel = await Channel.findOne({ "channel_id": channelId })

      if (!selectedChannel) { return res.send({ "canAccess": false }) }

      // selectedChannel.users_connected.map((data) => {
      //   if (data.username == selectedUser.username) {
      //     return res.send({ "canAccess": true })
      //   } else {
      //     return res.send({ "canAccess": false })
      //   }
      // })

      const checkChannelUsers = selectedChannel.users_connected.find((data) => data.username == selectedUser.username)

      if (!checkChannelUsers) {
        return res.send({ "canAccess": false })
      }

      res.send({ "canAccess": true })
    } catch (error) {
      console.log(error)
    }
  },

  LoadConnectedChannels: async function (req, res) {
    const token = req.headers.authorization

    try {
      const verifiedToken = await jwt.verify(token, process.env.SECRET)
      const selectedUser = await User.findOne({"email": verifiedToken.email})

      const channelsConnected = await Channel.find({"users_connected": {"username": selectedUser.username, "user_id": selectedUser.user_id}})

      let formatedChannels = []



      channelsConnected.map((data) => {
        let talkingWithUser

        data.users_connected.map((user) => {
          if (user.username != selectedUser.username) {
            talkingWithUser = {"username": user.username, "user_id": user.user_id}
          }
        })

        formatedChannels.push({"channel_id": data.channel_id, "talking_with": talkingWithUser})
      })

      res.send({"connectedChannels": formatedChannels})
    } catch (error) {
      
    }
  }
}

module.exports = userController