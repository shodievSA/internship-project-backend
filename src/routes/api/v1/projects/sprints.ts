import { RequestHandler, Router } from "express";
import projectController from "@/controllers/projectController";

const {
    createSprint,
    getSprintsTasks
} = projectController;

const router = Router({ mergeParams: true });

router.get('/:sprintId', getSprintsTasks as RequestHandler)
router.post('/', createSprint as RequestHandler);
//router.patch('/:inviteId', invitationStatus as RequestHandler);

export default router;
