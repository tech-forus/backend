import express from 'express';
import multer from 'multer';
import { addPincodeController, addTransporter, getPricesController, transporterPriceController } from '../controllers/adminController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/addtransporter",upload.single('serviceFile'), addTransporter);
router.post("/addpincode", addPincodeController);
router.post("/addprice", transporterPriceController);
router.get("/getprice", getPricesController);


export default router;
