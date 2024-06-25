const express = require('express');
const router = express.Router();
const { getUserData } = require('../controllers/userController');

router.post('/users/:userId', getUserData);

module.exports = router;
