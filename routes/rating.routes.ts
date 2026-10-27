
// routes/rating.routes.ts

// qui gestisco la valutazione di un libro
// il router padre già controlla login e id


import { Router } from "express";
import { getRating, setRating, deleteRating } from "../controllers/rating.controller";

const router = Router({ mergeParams: true });

router.get("/", getRating);
router.put("/", setRating);
router.delete("/", deleteRating);

export default router;
