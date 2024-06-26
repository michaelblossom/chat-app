const crypto = require("crypto"); //this is a built in node module basically use for generating randon strings expecially (passwordreset token)
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "please tell us your name"],
  },
  email: {
    type: String,
    required: [true, "please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "please provid a valid email"],
  },
  photo: String,

  password: {
    type: String,
    required: [true, "please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "passwords are not the same",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// hashing password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12); //encrypting or hashing the password
  this.passwordConfirm = undefined; //this will delete password confirm field so that it will not be stored in the database
  next();
});

// update changedPasswordAt field for the user(for resetting password)
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//query middleware
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
// creating a function that we check if the password that the user entered matched the one stotre stored in the database
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// function to check if the use changed the password after loged in
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  let changedTimestamp;
  if (this.passwordChangedAt) {
    changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
  }
  // console.log(this.passwordChangedAt, JWTTimestamp);
  return JWTTimestamp < changedTimestamp; //100 < 200

  // false means that password not changed
  return false;
};

// function to create password reset token
userSchema.methods.createPasswordResetToken = function () {
  // cerate a reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // encrypting the reset token
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log(resetToken, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken; //we returned the the plain reset token because it is the one we are going to send back to the client
};

const User = mongoose.model("User", userSchema);
module.exports = User;
