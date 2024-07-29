const {
  createChatSession,
  getAllChatSession,
} = require("../../controllers/chatsessionController");
const ChatSession = require("./../../models/chatSession");

//mocking out query methods in User collection(model)
jest.mock("./../../models/ChatSession");

const req = {
  body: {
    name: "fake_message",
    users: ["1", "2"],
  },
};
const request = {
  body: {
    userId: "1",
  },
};

const res = {
  status: jest.fn((x) => x),
  json: jest.fn((x) => x),
};
//TESTING FOR CREATE chatSession
test("should send a status code of 201 when chatSession is created", async () => {
  ChatSession.create.mockImplementationOnce(() => ({
    name: "fake_name",
    users: ["1", "2"],
  }));
  await createChatSession(req, res);
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledTimes(1);
});
