import express from 'express';
import { addPincodeController, addTransporter, getPricesController, transporterPriceController } from '../controllers/adminController.js';

const router = express.Router();

router.post("/addtransporter", addTransporter);
router.post("/addpincode", addPincodeController);
router.post("/addprice", transporterPriceController);
router.get("/getprice", getPricesController);


export default router;
