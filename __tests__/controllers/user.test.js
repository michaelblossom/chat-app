const { getAllUsers } = require("../../controllers/userController");
const User = require("./../../models/userModel");

//mocking out query methods in User collection(model)
jest.mock("./../../models/userModel");

const req = {};

const res = {
  status: jest.fn((x) => x),
  json: jest.fn((x) => x),
};

test("should send a status code of 200 when the request is successful", async () => {
  User.find.mockImplementationOnce(() => ({}));
  await getAllUsers(req, res);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledTimes(1);
});
