
class CustomError extends Error {
  /**
   * Custom Error Constructor
   * @param {any} [message] - Optional error payload
   * @param {number} [statusCode] - Optional error http status code
   * @param {string} [cause=""] - Optional feedback message you want to provide
   */
  constructor(message,statusCode) {
    super(message);
    this.name = "CustomError";
    this.status = statusCode;
    this.cause = message;
  }
}

export default CustomError;
