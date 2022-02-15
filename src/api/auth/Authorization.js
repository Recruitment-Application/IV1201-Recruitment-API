'use strict';

const jwt = require('jsonwebtoken');

/**
 * Handles user authorization, 
 */
class Authorization {
    /**
     * The authentication/authorization cookie name.
     */
    static get AUTH_COOKIE_NAME() {
        return 'recruitmentAuth';
    }

    /**
     * Verifies the authentication of a user using the JWT token contained in a cookie.
     * The authentication cookie is also cleared in case of verification failure.
     * 
     * @param {Request} req The express Request object.
     * @param {Response} res The express Response object.
     * @returns {UserDTO | null} An object containing the username and the role of the user
     *                           or null in case of verification failure.
     */
    static async verifyAuthCookie(req, res) {
        const authCookie = req.cookies.recruitmentAuth;
        if (!authCookie) {
            return null;
        }
        try {
            const userDTOPayload = jwt.verify(authCookie, process.env.JWT_SECRET);
            const userDTO = userDTOPayload.userDTO;
            return userDTO;
        } catch (err) {
            res.clearCookie(this.AUTH_COOKIE_NAME);
            return null;
        }
    }

    /**
     * Sets the authentication cookie containing the signed JSON Web Token
     * in the express response object.
     * 
     * @param {UserDTO} userDTO An object containing the username and the role of the user.
     * @param {Response} res The express Response object.
     */
    static setAuthCookie(userDTO, res) {
        const httpOnlyCookie = { httpOnly: true };
        const cookieAge = { maxAge: 7 * 24 * 60 * 60 * 1000 }; // 1 Week (maxAge is in seconds, but in cookie it's in ms.)

        const jwtToken = jwt.sign(
            { userDTO },
            process.env.JWT_SECRET,
            {
                expiresIn: '7 days',
            },
        );

        const cookieOptions = {
            ...httpOnlyCookie,
            ...cookieAge,
        };
        res.cookie(this.AUTH_COOKIE_NAME, jwtToken, cookieOptions);
    }
}

module.exports = Authorization;