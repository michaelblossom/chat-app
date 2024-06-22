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

// loggin a user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1)check if email and password exist
  if (!email || !password) {
    return next(new AppError("please provide email and password", 400));
  }

  //   // 2)check if user exist and password is correct
  const user = await User.findOne({ email: email }).select("+password");
  //checking is user exist and both the password passed by the user and the one in the databse matched
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("incorrect email or password", 401));
  }
  //calling createAndSendToken function
  createAndSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1)Getting token and check if it exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookie.jwt;
  }
  if (!token) {
    // console.log(token);
    return next(
      new AppError("you are not loggedin, please login to get access", 401)
    );
  }
  // 2)verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  // 3)check if the user accessing the route still exist
  const currentUser = await User.findById(decoded.id); //we are using findById because we use our id as our payload in generating the token that is stored in our decoded
  if (!currentUser) {
    return next(
      new AppError(
        "The User belonging to this token does not exist anylonger",
        401
      )
    );
  }
  //   // 4)check if user change password after token was issued
  //   // calling passwordchangedAfter instant function from userModel
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password please login again", 401)
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});
