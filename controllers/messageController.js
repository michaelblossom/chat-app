const Message = require("../models/message");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createMessage = catchAsync(async (req, res, next) => {
  const newMessage = await Message.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      message: newMessage,
    },
  });
});
