import { RequestHandler, Router } from "express";
import { getMemberPermissions } from "@/middlewares/getMemberPermissions";
import projectController from "@/controllers/projectController";
const {
	inviteToProject,
    invitationStatus,
} = projectController;

const router = Router({ mergeParams: true });

router.post('/', getMemberPermissions, inviteToProject as RequestHandler);
router.patch('/:inviteId', invitationStatus as RequestHandler);

export default router;
