const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" }); //to show the path that the config file is located

const app = require("./app"); //importing app file to the server file
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
    // console.log(con.connections);
    console.log("Db connection successful");
  });
const port = 3000;
// starting the server
const server = app.listen(port, () => {
  console.log(`App running in port ${port}...`);
});
