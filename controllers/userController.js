const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const multer = require("multer");

// functions that will filter out fields tha we dont want to update
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// configuring multer
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else
    new AppError("This is not an image, please upload only image", 400), false;
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const uploadUserPhoto = upload.single("photo");

// USER HANDLLERS
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  // sending response
  res.status(200);
  res.json({
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

// updating current user data
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user tries post password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "this route is not for password update please use  updateMyPassword route",
        400
      )
    );
  }

  // 2)filtering out the unwanted field names that are not allowed to be updated by calling the filterObj function and storing it in filteredBody
  const filteredBody = filterObj(req.body, "name", "email");

  // 3)update the user document
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});
