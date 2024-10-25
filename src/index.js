require('dotenv').config()
const moongose = require('mongoose')
const express = require('express')
const cors = require('cors')
const app = express()

const User = require('./models/User')
const Channel = require('./models/Channel')
const jwt = require('jsonwebtoken')

const userRouter = require('./routes/userRouter')

const server = app.listen(process.env.PORT, () => { console.log(`Connected to PORT: ${process.env.PORT}`) })
const socketIO = require('socket.io')(server, {
  cors: {
    origin: "*"
  }
})

app.get("/status", (req, res) => {
 res.send("PDIDDYYYYYYYYYY")
})

socketIO.on('connection', (socket) => {
  console.log('A new device is connected')

  // socket.on('open_channel', (data) => {
  //   console.log(data.msg)
  //   socket.emit('open_channel_response')
  // })

  socket.on('load_channel', async (data) => {
    try {
      const verifiedToken = await jwt.verify(data.sender_token, process.env.SECRET)
      const userSelected = await User.findOne({ email: verifiedToken.email })
      const channel = await Channel.findOne({ "channel_id": data.channel_id })

      let sendChannelName

      channel.users_connected.map((data) => {
        if (data.username != userSelected.username) {
          sendChannelName = data.username
        }
      })

      socket.emit('found_channel', { "name": sendChannelName, "messages": channel.messages })
    } catch (error) {
      console.log(error)
    }
  })

  socket.on('new_message', async (data) => {
    try {
      const verifiedToken = await jwt.verify(data.senderToken, process.env.SECRET)
      const userSelected = await User.findOne({ email: verifiedToken.email })
      const newMessage = { sender: userSelected.username, message: [data.message] }

      let channel = await Channel.findOne({ "channel_id": data.channel_id })
      const lastMessageIndex = channel.messages.length - 1

      if (channel.messages.length == 0 || channel.messages[lastMessageIndex].sender == "") {
        await Channel.updateOne({ "channel_id": data.channel_id }, { $set: { messages: [newMessage] } })
      } else if (channel.messages[lastMessageIndex].sender == newMessage.sender) {
        await Channel.updateOne({ "channel_id": data.channel_id }, { $push: { [`messages.${lastMessageIndex}.message`]: newMessage.message[0] } })
      } else {
        await Channel.updateOne({ "channel_id": data.channel_id }, { $push: { messages: newMessage } })
      }
      
      channel = await Channel.findOne({ "channel_id": data.channel_id })
      socketIO.emit('update_channel', {"messages": channel.messages})
    } catch (error) {
      console.log(error)
    }
  })

  // socket.on('new_message', async (data) => {
  //   try {
  //     const verifiedToken = await jwt.verify(data.senderToken, process.env.SECRET)
  //     const userSelected = await User.findOne({ email: verifiedToken.email })
  //     const newMessage = { sender: userSelected.username, message: [data.message] }

  //     if (testChannel.messages.length == 0) {
  //       testChannel.messages.push(newMessage)
  //     } else if (testChannel.messages[testChannel.messages.length - 1].sender == newMessage.sender) {
  //       testChannel.messages[testChannel.messages.length - 1].message.push(newMessage.message[0])
  //     } else {
  //       testChannel.messages.push(newMessage)
  //     }

  //     socketIO.emit('update_channel', testChannel)
  //   } catch (error) {
  //     console.log(error)
  //   }
  // })
})

moongose.connect(process.env.CONNECT_URL)
const dataBase = moongose.connection
dataBase.on('error', () => { console.log("error") })
dataBase.once('open', () => { console.log("Mongo Connected") })

// app.use('/', express.urlencoded({ extended: true }), userRouter)
app.use(cors())
app.use('/', express.json(), userRouter)