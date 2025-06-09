import express from 'express';
import { addTransporter } from '../controllers/adminController.js';

const router = express.Router();

router.post("/addtransporter", addTransporter);

export default router;
