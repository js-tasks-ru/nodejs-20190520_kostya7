const User = require('../../models/User');

module.exports = async function authenticate(strategy, email, displayName, done) {
  try {
    if (!email) {
      return done(null, false, 'Не указан email');
    }
    const user = await User.findOne({email: email});
    if (user) {
      return done(null, user);
    }

    const newUser = new User({ email: email, displayName: displayName });
    const saveNewUser = await newUser.save();

    if (saveNewUser) {
      return done(null, saveNewUser);
    }

    done(null, false, `функция аутентификации с помощью ${strategy} не настроена`);
  } catch (e) {
    done(e);
  }
};
