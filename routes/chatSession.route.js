const express = require("express");
const chatSessionController = require("../controllers/chatsessionController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .post(chatSessionController.createChatSession)
  .get(chatSessionController.getAllChatSession);

module.exports = router;
