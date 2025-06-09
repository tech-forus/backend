import express from 'express';
import { transporterPriceController, addPincodeController, getPricesController, calculatePrice } from '../controllers/transportController.js';

const router = express.Router();

router.post('/addpincode', addPincodeController);
router.post('/addtransporterprice', transporterPriceController);
router.get('/gettransporterprice', getPricesController);
router.post('/calculate', calculatePrice);
//router.post('/addtiedupcompanies', addTiedUpCompanies);

export default router;
