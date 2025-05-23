const { validateName, validatePassword } = require('../../src/utils/authenticationUtils/validators');

describe("Validator Utils", () => {
  test("validateName returns true for valid name", () => {
    expect(validateName("Azna")).toBe(true);
  });

  test("validateName returns false for short name", () => {
    expect(validateName("Ab")).toBe(false);
  });

  test("validatePassword returns true for strong password", () => {
    expect(validatePassword("Test@1234")).toBe(true);
  });

  test("validatePassword returns false for weak password", () => {
    expect(validatePassword("123456")).toBe(false);
  });
});
