const path = require('path');

module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "..",
  testEnvironment: "node",
  testRegex: "test/.*\\.e2e-spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": require.resolve("ts-jest")
  }
};
