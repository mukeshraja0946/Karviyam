class ApiResponse {
  static success(data = null, message = 'Operation successful') {
    return {
      success: true,
      message,
      data
    };
  }

  static error(message = 'Operation failed', data = null) {
    return {
      success: false,
      message,
      data
    };
  }
}

module.exports = ApiResponse;
