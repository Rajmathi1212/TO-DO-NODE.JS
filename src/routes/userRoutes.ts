import express from 'express';
import { createUser, deleteUser, getAllUser, getUserById, updateUser } from '../controllers/userController';
import rateLimit from 'express-rate-limit';


const router = express.Router();
let apiRateLimit = rateLimit({
    max: 10,
    windowMs: 15 * 60 * 1000,
    message: 'You have reached your limit of adding 10 items. Please wait 3 minutes before trying again'
});

router.post('/create', apiRateLimit, createUser);
router.get('/getAll', apiRateLimit, getAllUser);
router.get('/getById/:userId', apiRateLimit, getUserById);
router.put('/update', apiRateLimit, updateUser);
router.delete('/delete/:userId', apiRateLimit, deleteUser);

export { router as userRouter }