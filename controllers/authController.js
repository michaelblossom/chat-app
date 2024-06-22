const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");

// function to generate token
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};

// function to create and send token to client
const createAndSendToken = (user, statusCode, res) => {
  // calling signToken function to generate token
  const token = signToken(user._id);
  const cookiesOptions = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPJIRES_IN * 24 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookiesOptions.secure = true; //we only want secure option when we are in production
  // creating a cookie
  res.cookie("jwt", token, cookiesOptions);

  // removing password field when a user is signedup
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token, //sending the token to the user
    data: {
      user: user,
    },
  });
};

// signup a user
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // calling the createAndSendToken function
  createAndSendToken(newUser, 201, res);
});
