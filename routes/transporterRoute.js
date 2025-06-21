import express from 'express';
import { addTiedUpCompany, calculatePrice, getTiedUpCompanies, getTransporters } from '../controllers/transportController.js';
import multer from "multer";
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }  // e.g. 5MB limit
});

router.post('/calculate', protect, calculatePrice);
router.post("/addtiedupcompanies", protect, upload.single('priceChart'), addTiedUpCompany);
router.get("/gettiedupcompanies", protect, getTiedUpCompanies);
router.get("/gettransporter", protect, getTransporters);
//router.post('/addtiedupcompanies', addTiedUpCompanies);

export default router;
