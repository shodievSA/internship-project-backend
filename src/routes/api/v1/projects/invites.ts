import { RequestHandler, Router } from "express";
import { getMemberPermissions } from "@/middlewares/getMemberPermissions";
import projectController from "@/controllers/projectController";

const {
	inviteToProject,
    invitationStatus,
    getProjectInvites,
} = projectController;

const router = Router({ mergeParams: true });

router.get('/', getProjectInvites as RequestHandler)
router.post('/', inviteToProject as RequestHandler);
router.patch('/:inviteId', invitationStatus as RequestHandler);

export default router;
