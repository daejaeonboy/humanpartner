import { Router, Request, Response } from 'express';
import { Booking } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Mock Data
let bookings: Booking[] = [];

// GET /api/bookings
router.get('/', (req: Request, res: Response) => {
    res.json(bookings);
});

// POST /api/bookings
router.post('/', (req: Request, res: Response) => {
    const { productId, userId, startDate, endDate, totalPrice } = req.body;

    if (!productId || !userId || !startDate || !endDate || !totalPrice) {
        res.status(400).json({ message: 'Missing required fields' });
        return; // Ensure function returns here
    }

    const newBooking: Booking = {
        id: uuidv4(),
        productId,
        userId,
        startDate,
        endDate,
        totalPrice,
        status: 'pending'
    };

    bookings.push(newBooking);
    res.status(201).json(newBooking);
});

export default router;
