require('dotenv').config()
const moongose = require('mongoose')
const express = require('express')
const app = express()

const userRouter = require('./routes/userRouter')

moongose.connect(process.env.CONNECT_URL)
const dataBase = moongose.connection
dataBase.on('error', () => {console.log("error")})
dataBase.once('open', () => {console.log("Mongo Connected")})

app.use('/', express.urlencoded({ extended: true }), userRouter)
app.listen(process.env.PORT, () => { console.log(`Connected to PORT: ${process.env.PORT}`) })