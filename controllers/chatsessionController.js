const ChatSession = require("../models/chatSession");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

exports.createChatSession = catchAsync(async (req, res, next) => {
  const { users } = req.body;
  if (users.length !== 2)
    return next(
      new AppError("A chat session must include exactly two users.", 400)
    );

  const newChatSession = await ChatSession.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      ChatSession: newChatSession,
    },
  });
});
