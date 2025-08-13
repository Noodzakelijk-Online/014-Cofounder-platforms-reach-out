// __mocks__/pg.js

const mPool = {
  query: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
};

const pg = {
  Pool: jest.fn(() => mPool),
};

module.exports = pg;
