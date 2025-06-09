import jwt from 'jsonwebtoken';
import customerModel from '../models/Customer.js'; // Adjust path as per your project structure
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const protect = async (req, res, next) => {
    let token;

    // 1. Check for token in Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer <token_string>")
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                // This case is unlikely if startsWith('Bearer') is true and split works,
                // but good for robustness.
                return res.status(401).json({ success: false, message: 'Not authorized, no token found in Bearer string' });
            }

            // 2. Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // 3. Attach user to the request object
            //    The payload during login was { customer: { id: customer.id, ... } }
            //    So, decoded.customer.id should exist.
            //    We select '-password' to ensure the hashed password is not attached to req.customer
            req.customer = await customerModel.findById(decoded.customer._id).select('-password');

            if (!req.customer) {
                // If the user ID in the token doesn't correspond to an actual user
                // (e.g., user was deleted after token was issued)
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            next(); // Token is valid, user is found, proceed to the route handler
        } catch (error) {
            console.error('Token verification failed:', error.message);
            // Handle specific JWT errors for better client feedback
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ success: false, message: 'Not authorized, token is invalid' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Not authorized, token has expired' });
            }
            // Generic catch-all for other errors during token processing
            return res.status(401).json({ success: false, message: 'Not authorized, token processing failed' });
        }
    }

    // 4. If no token at all in the Authorization header
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }
};