import projectController from "../../../../controllers/projectController";
import { RequestHandler, Router } from "express";

const router = Router({ mergeParams: true });

router.post('/', projectController.createTask as RequestHandler);

export default router;
