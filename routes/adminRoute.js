import express from 'express';
import multer from 'multer';
import { addPincodeController, addPrice, addTransporter, downloadTransporterTemplate, getPricesController } from '../controllers/adminController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/addtransporter",upload.single('sheet'), addTransporter);
router.get("/downloadtemplate", downloadTransporterTemplate);
router.post("/addpincode", addPincodeController);
router.post("/addprice", addPrice);
router.get("/getprice", getPricesController);


export default router;
