'use strict';

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const database = require('../models');
const { getRoleByName } = require('../models/repo/role.repo');

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await database.User.findOne({
                    where: {
                        google_id: profile.id,
                    },
                    include: [{ model: database.Role, as: 'role' }],
                });

                if (user) {
                    // User exists, return user
                    return done(null, user);
                }

                // Check if user exists with same email
                const existingUser = await database.User.findOne({
                    where: {
                        email: profile.emails[0].value,
                    },
                });

                if (existingUser) {
                    // Link Google account to existing user
                    existingUser.google_id = profile.id;
                    existingUser.avatar = profile.photos[0].value;
                    await existingUser.save();

                    const userWithRole = await database.User.findOne({
                        where: { id: existingUser.id },
                        include: [{ model: database.Role, as: 'role' }],
                    });

                    return done(null, userWithRole);
                }

                // Create new user
                const userRole = await getRoleByName('user');
                if (!userRole) {
                    throw new Error('Default user role not found');
                }

                const newUser = await database.User.create({
                    google_id: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    avatar: profile.photos[0].value,
                    user_login: profile.emails[0].value,
                    user_pass: null, // No password for Google users
                    role_id: userRole.id,
                    email_verified: true, // Google accounts are pre-verified
                    status: 'active',
                });

                const userWithRole = await database.User.findOne({
                    where: { id: newUser.id },
                    include: [{ model: database.Role, as: 'role' }],
                });

                return done(null, userWithRole);
            } catch (error) {
                console.error('Google OAuth error:', error);
                return done(error, null);
            }
        },
    ),
);

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await database.User.findOne({
            where: { id },
            include: [{ model: database.Role, as: 'role' }],
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
