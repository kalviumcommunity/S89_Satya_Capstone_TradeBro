import Bloc from '../Bloc';
import AuthRepository from '../repositories/AuthRepository';
import {
  LoginEvent,
  LoginWithGoogleEvent,
  RegisterEvent,
  LogoutEvent,
  CheckAuthEvent,
  ForgotPasswordEvent,
  ResetPasswordEvent
} from '../events/AuthEvents';
import {
  AuthInitial,
  AuthLoading,
  AuthAuthenticated,
  AuthUnauthenticated,
  AuthError,
  AuthPasswordResetSent,
  AuthPasswordResetSuccess
} from '../states/AuthStates';

/**
 * AuthBloc handles authentication-related events and emits authentication states
 */
class AuthBloc extends Bloc {
  constructor() {
    super(new AuthInitial());
    this.repository = AuthRepository;
  }

  /**
   * Map events to states
   * @param {Event} event - The event to handle
   */
  async mapEventToState(event) {
    try {
      if (event instanceof LoginEvent) {
        await this.handleLogin(event);
      } else if (event instanceof LoginWithGoogleEvent) {
        await this.handleLoginWithGoogle(event);
      } else if (event instanceof RegisterEvent) {
        await this.handleRegister(event);
      } else if (event instanceof LogoutEvent) {
        await this.handleLogout();
      } else if (event instanceof CheckAuthEvent) {
        await this.handleCheckAuth();
      } else if (event instanceof ForgotPasswordEvent) {
        await this.handleForgotPassword(event);
      } else if (event instanceof ResetPasswordEvent) {
        await this.handleResetPassword(event);
      }
    } catch (error) {
      console.error('AuthBloc error:', error);
      this.emit(new AuthError(error.toString()));
    }
  }

  /**
   * Handle login event
   * @param {LoginEvent} event - Login event
   */
  async handleLogin(event) {
    this.emit(new AuthLoading());
    try {
      const user = await this.repository.login(event.email, event.password);
      this.emit(new AuthAuthenticated(user));
    } catch (error) {
      this.emit(new AuthError(error.toString()));
    }
  }

  /**
   * Handle login with Google event
   * @param {LoginWithGoogleEvent} event - Login with Google event
   */
  async handleLoginWithGoogle(event) {
    this.emit(new AuthLoading());
    try {
      const user = await this.repository.loginWithGoogle(event.token);
      this.emit(new AuthAuthenticated(user));
    } catch (error) {
      this.emit(new AuthError(error.toString()));
    }
  }

  /**
   * Handle register event
   * @param {RegisterEvent} event - Register event
   */
  async handleRegister(event) {
    this.emit(new AuthLoading());
    try {
      await this.repository.register(event.userData);
      this.emit(new AuthUnauthenticated());
    } catch (error) {
      this.emit(new AuthError(error.toString()));
    }
  }

  /**
   * Handle logout event
   */
  async handleLogout() {
    this.emit(new AuthLoading());
    try {
      await this.repository.logout();
      this.emit(new AuthUnauthenticated());
    } catch (error) {
      this.emit(new AuthError(error.toString()));
    }
  }

  /**
   * Handle check auth event
   */
  async handleCheckAuth() {
    this.emit(new AuthLoading());
    try {
      const user = await this.repository.checkAuth();
      if (user) {
        this.emit(new AuthAuthenticated(user));
      } else {
        this.emit(new AuthUnauthenticated());
      }
    } catch (error) {
      this.emit(new AuthUnauthenticated());
    }
  }

  /**
   * Handle forgot password event
   * @param {ForgotPasswordEvent} event - Forgot password event
   */
  async handleForgotPassword(event) {
    this.emit(new AuthLoading());
    try {
      await this.repository.forgotPassword(event.email);
      this.emit(new AuthPasswordResetSent(event.email));
    } catch (error) {
      this.emit(new AuthError(error.toString()));
    }
  }

  /**
   * Handle reset password event
   * @param {ResetPasswordEvent} event - Reset password event
   */
  async handleResetPassword(event) {
    this.emit(new AuthLoading());
    try {
      await this.repository.resetPassword(event.token, event.password);
      this.emit(new AuthPasswordResetSuccess());
    } catch (error) {
      this.emit(new AuthError(error.toString()));
    }
  }
}

export default AuthBloc;
