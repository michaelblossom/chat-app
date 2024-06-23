const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// // protecting thr routes below for onl loggedin users
// // router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
// update the profile of the currently logged in user
router.patch("/updateMe", userController.updateMe);
router.route("/").get(userController.getAllUsers);

router.route("/:id").get(userController.getUser);

// //route for updating currently logged in user profile
router.get("/me", userController.getMe, userController.getUser);

// deleting currently logged in user
router.delete("/deleteMe", userController.deleteMe);

module.exports = router;
