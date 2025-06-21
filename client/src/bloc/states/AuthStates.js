import State from '../State';

/**
 * Initial auth state
 */
export class AuthInitial extends State {
  constructor() {
    super('AUTH_INITIAL');
  }
}

/**
 * Loading auth state
 */
export class AuthLoading extends State {
  constructor() {
    super('AUTH_LOADING');
  }
}

/**
 * Authenticated state
 */
export class AuthAuthenticated extends State {
  constructor(user) {
    super('AUTH_AUTHENTICATED');
    this.user = user;
  }
}

/**
 * Unauthenticated state
 */
export class AuthUnauthenticated extends State {
  constructor() {
    super('AUTH_UNAUTHENTICATED');
  }
}

/**
 * Auth error state
 */
export class AuthError extends State {
  constructor(error) {
    super('AUTH_ERROR');
    this.error = error;
  }
}

/**
 * Password reset sent state
 */
export class AuthPasswordResetSent extends State {
  constructor(email) {
    super('AUTH_PASSWORD_RESET_SENT');
    this.email = email;
  }
}

/**
 * Password reset success state
 */
export class AuthPasswordResetSuccess extends State {
  constructor() {
    super('AUTH_PASSWORD_RESET_SUCCESS');
  }
}
