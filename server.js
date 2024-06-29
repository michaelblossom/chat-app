const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const catchAsync = require("./utils/catchAsync");
const chatEvents = require("./utils/chatEvents");

const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

require("./models/message");
require("./models/chatSession");
require("./models/userModel");

const app = require("./app");
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log("Db connection successful");
  });
const port = 3000;
// starting the server
const server = app.listen(port, () => {
  console.log(`App running in port ${port}...`);
});

const io = new Server(server);

const Message = mongoose.model("Message");
const User = mongoose.model("User");

io.use(
  catchAsync(async (socket, next) => {
    const token = socket.handshake.query.token;
    const decoded = await promisify(jwt.verify)(token, JWT_SECRET);
    const currentUser = await User.findById(decoded._id);
    if (!currentUser) {
      return next(
        new AppError(
          "The User belonging to this token does not exist anylonger",
          401
        )
      );
    }
    // GRANT ACCESS TO PROTECTED ROUTE
    socket.userId = currentUser;

    next();
  })
);

io.on(chatEvents.connection, (socket) => {
  console.log("connection" + socket.userId);

  socket.on(chatEvents.disconnection, (socket) => {
    console.log("disconnected" + socket.userId);
  });

  socket.on(chatEvents.joinSession, ({ chatSessionId }) => {
    socket.join(chatSessionId);
    console.log("A user joined chatsession:" + chatSessionId);
  });

  socket.on(chatEvents.leaveSession, ({ chatSessionId }) => {
    socket.join(chatSessionId);
    console.log("A user left chatSession:" + chatSessionId);
  });

  socket.on(
    chatEvents.chatSessionMessage,
    async ({ chatSessionId, message }) => {
      if (message.trim().length > 0) {
        const user = await User.findOne({ _id: socket.userId });
        const newMessage = new Message({
          chatSession: chatSessionId,
          user: socket.userId,
          message,
        });
        io.to(chatSessionId).emit(chatEvents.newMessage, {
          message,
          name: user.name,
          userId: socket.userId,
        });
        await newMessage.save();
      }
    }
  );
});
