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

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address.", 404));
  }
  // generate randon token
  // calling the createPasswordResetToken function from userModel
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // this line of code is important because it prevents validation error which can lead to confirm password
  // send it back as an email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? submit a PATCH request with your new password and passwordConfirm to:${resetURL}./n if you did not forget your password please ignore this email`;
  try {
    await sendEmail({
      email: user.email, //user.email or req.body.email
      subject: "your password reset token {valid for 10 min}",
      message: message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email please try again later",
        500
      )
    );
  }
});

//RESET PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 404));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changedPassword property for the user
  //this step was done in the user model
  // 4) Log the user in, send JWT
  createAndSendToken(user, 200, res);
});
// updating password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1)get the user from the collection
  const user = await User.findById(req.user.id).select("+password");
  // 2)check if the posted pasted password is correct
  // calling correctpassword function from usermodel
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("your current password is wrong", 401));
  }
  // 3)if if the posted password is correct, update the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save({ validateBeforeSave: false });
  // 4)Log user in, send jwt
  // calling the createAndSendToken function
  createAndSendToken(user, 200, res);
});
