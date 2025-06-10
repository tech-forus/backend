import express from 'express';
import { calculatePrice } from '../controllers/transportController.js';

const router = express.Router();

router.post('/calculate', calculatePrice);
//router.post('/addtiedupcompanies', addTiedUpCompanies);

export default router;
