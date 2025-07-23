import { RequestHandler, Router } from "express";
import projectController from "@/controllers/projectController";
import { upload } from "@/middlewares/fileUploads";

const {
    createSprint,
    getSprintsTasks,
	createTask
} = projectController;

const router = Router({ mergeParams: true });

router.post('/:sprintId/tasks', upload.array('fileAttachments'), createTask as RequestHandler);
router.get('/:sprintId', getSprintsTasks as RequestHandler)
router.post('/', createSprint as RequestHandler);
// router.patch('/:inviteId', invitationStatus as RequestHandler);

export default router;
