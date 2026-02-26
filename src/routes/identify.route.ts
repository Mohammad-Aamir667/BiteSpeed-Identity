import { Router } from "express";
import { identifyContact } from "../services/identify.service";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;
        const result = await identifyContact(email, phoneNumber);
        res.status(200).json({ contact: result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
