import Event from '../Event';

/**
 * Login event
 */
export class LoginEvent extends Event {
  constructor(email, password) {
    super('LOGIN');
    this.email = email;
    this.password = password;
  }
}

/**
 * Login with Google event
 */
export class LoginWithGoogleEvent extends Event {
  constructor(token) {
    super('LOGIN_WITH_GOOGLE');
    this.token = token;
  }
}

/**
 * Register event
 */
export class RegisterEvent extends Event {
  constructor(userData) {
    super('REGISTER');
    this.userData = userData;
  }
}

/**
 * Logout event
 */
export class LogoutEvent extends Event {
  constructor() {
    super('LOGOUT');
  }
}

/**
 * Check auth event
 */
export class CheckAuthEvent extends Event {
  constructor() {
    super('CHECK_AUTH');
  }
}

/**
 * Forgot password event
 */
export class ForgotPasswordEvent extends Event {
  constructor(email) {
    super('FORGOT_PASSWORD');
    this.email = email;
  }
}

/**
 * Reset password event
 */
export class ResetPasswordEvent extends Event {
  constructor(token, password) {
    super('RESET_PASSWORD');
    this.token = token;
    this.password = password;
  }
}
