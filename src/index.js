require('dotenv').config()
const moongose = require('mongoose')
const express = require('express')
const cors = require('cors')
const app = express()

const userRouter = require('./routes/userRouter')

moongose.connect(process.env.CONNECT_URL)
const dataBase = moongose.connection
dataBase.on('error', () => {console.log("error")})
dataBase.once('open', () => {console.log("Mongo Connected")})

// app.use('/', express.urlencoded({ extended: true }), userRouter)
app.use('/', express.json(), userRouter)
app.listen(process.env.PORT, () => { console.log(`Connected to PORT: ${process.env.PORT}`) })