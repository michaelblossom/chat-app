const express = require("express");
const morgan = require("morgan");

const AppError = require("./utils/appError");
const userRouter = require("./routes/userRoute");

const app = express();
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json({ limit: "10kb" }));

app.use(express.static(`${__dirname}/public`));

app.get("/", (req, res, next) => {
  res.send("Hello from middleware");
  next();
});
//defining routes

app.use("/api/v1/users", userRouter);

// handling undefined route
app.all("*", (req, res, next) => {
  next(new AppError(`cant't find ${req.originalUrl} on this saver!`, 404));
});

//app.use(globalErrorHandler);

module.exports = app;
