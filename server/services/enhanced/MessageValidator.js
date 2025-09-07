class MessageValidator {
  validateMessage(userMessage, userId = null) {
    if (!userMessage || typeof userMessage !== 'string') {
      return {
        isValid: false,
        errors: ['Message is required and must be a string'],
        language: 'en'
      };
    }

    if (userMessage.trim().length < 2) {
      return {
        isValid: false,
        errors: ['Message too short'],
        language: 'en'
      };
    }

    return {
      isValid: true,
      errors: [],
      language: 'en',
      sanitizedMessage: userMessage.trim()
    };
  }
}

module.exports = MessageValidator;