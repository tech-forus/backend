import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { addPincodeController, addPrice, addTransporter, downloadTransporterTemplate, getPricesController } from '../controllers/adminController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/addtransporter", protect, upload.single('sheet'), addTransporter);
router.get("/downloadtemplate", protect, downloadTransporterTemplate);
router.post("/addpincode", protect, addPincodeController);
router.post("/addprice", protect, addPrice);
router.get("/getprice", protect, getPricesController);


export default router;
