const express = require('express')
const router = express.Router()
const cors = require('cors')
const userController = require('../controller/userController')

router.use(cors())
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/checkToken', userController.checkToken)
router.post('/verifyNewUser', userController.verifyNewUser)
router.post('/updateUsername', userController.updateUsername)

module.exports = router