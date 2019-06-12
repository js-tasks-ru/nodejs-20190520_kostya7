const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models/User');

module.exports = new LocalStrategy(
    {usernameField: 'email', session: false},
    function(email, password, done) {
        User.findOne({email: email}, (err, user) => {
            if (!user) {
                done(null, false, 'Нет такого пользователя');
                return;
            }

            user.checkPassword(password).then(result => {
                if (result) {
                    done(null, user);
                } else {
                    done(null, false, 'Невереный пароль');
                }
            });
        });
    }
);
