/**
 * User model
 */
class User {
  constructor(data = {}) {
    this.id = data.id || data._id || null;
    this.email = data.email || '';
    this.fullName = data.fullName || '';
    this.profileImage = data.profileImage || null;
    this.role = data.role || 'user';
    this.phoneNumber = data.phoneNumber || '';
    this.joinDate = data.joinDate || new Date().toISOString();
    this.tradingExperience = data.tradingExperience || 'Beginner';
    this.preferredMarkets = data.preferredMarkets || ['Stocks', 'ETFs', 'Crypto'];
    this.bio = data.bio || '';
  }

  /**
   * Create a User instance from API data
   * @param {Object} data - API data
   * @returns {User} User instance
   */
  static fromJson(data) {
    return new User(data);
  }

  /**
   * Convert User instance to JSON
   * @returns {Object} JSON representation of User
   */
  toJson() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      profileImage: this.profileImage,
      role: this.role,
      phoneNumber: this.phoneNumber,
      joinDate: this.joinDate,
      tradingExperience: this.tradingExperience,
      preferredMarkets: this.preferredMarkets,
      bio: this.bio
    };
  }
}

export default User;
