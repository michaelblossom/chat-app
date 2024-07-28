const { createMessage } = require("../../controllers/messageController");
const Message = require("./../../models/message");

//mocking out query methods in User collection(model)
jest.mock("./../../models/message");

const req = {
  body: {
    chatSession: "fake_session",
    message: "fake_message",
    user: "fake_user",
  },
};

const res = {
  status: jest.fn((x) => x),
  json: jest.fn((x) => x),
};
//TESTING FOR CREATE MESSAGE
test("should send a status code of 201 when message is created", async () => {
  Message.create.mockImplementationOnce(() => ({
    chatSession: "1",
    message: "fake_message",
    user: "1",
  }));
  await createMessage(req, res);
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledTimes(1);
});
