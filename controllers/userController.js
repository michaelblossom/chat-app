const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
// USER HANDLLERS
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  // sending response
  res.status(200).json({
    status: "success",
    result: users.length,
    data: {
      users,
    },
  });
});

//get user
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.find(req.params.id);
  // sending response
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// getMe endpoint will allow user to get their own details
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// deleteing a user
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});
