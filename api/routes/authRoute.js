const express = require("express");
const {
  registerUser,
  login,
  refreshToken,
  refreshTokenWeb,
  resetPassword,
  changePassword,
  verifyPhone,
  sendVerificationCode,
  deleteAccount,
  registerUsersBulk,
  getUsersByRoleAndSession,
  verifyEmail,
  resendEmailVerirficationCode,
  addSessionToUsersWithoutSession,
  forgotPassword,
  getProfileByUserId,
  getAllHODs,
  updateUserProfile,
} = require("../controller/authController");
const verify = require("../middlewares/verifyToken");
const passport = require("passport");
const router = express.Router();

router.post("/register", registerUser);
router.post("/register/bulk", registerUsersBulk); // ✅ new
router.post("/login", login);
router.get("/profile/:id", verify, getProfileByUserId);
router.get("/get/refreshtoken", refreshToken);
router.get("/get/refreshtokenweb", refreshTokenWeb);
router.put("/reset/password/:id", changePassword);
router.put("/reset/password", changePassword);

router.post(
  "/addSessionToUsersWithoutSession",
  addSessionToUsersWithoutSession
);
// routes/userRoutes.js
router.get("/hods", getAllHODs);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get("/users/:role/:sessionId", getUsersByRoleAndSession);

// Callback route for Google to redirect to
// router.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: "/login",
//     session: false,
//   }),
//   (req, res) => {
//     const token = req.user.token;
//     /* res.status(200).json({
//             status: 'success',
//             message: 'Login was successful',
//             data: {accessToken: token, refreshToken:token},
//         }); */

//     res.redirect(
//       `http://localhost:5173/explore?accessToken=${token}&refreshToken=${token}`
//     );
//     console.log("Redirecting with token:", token);
//   }
// );
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    console.log("User Object from Passport:", req.user); // Check if req.user exists
    console.log("Generated Token:", req.user?.token); // Check if the token is available

    if (!req.user || !req.user.token) {
      return res.status(400).json({ message: "Token not generated." });
    }

    const token = req.user.token;
    res.redirect(
      `https://skilloviaweb.vercel.app/explore?accessToken=${token}&refreshToken=${token}`
    );
  }
);
router.put("/profile/:id", updateUserProfile);

router.delete("/delete-account", verify, deleteAccount);

module.exports = router;
