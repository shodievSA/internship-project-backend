import { RequestHandler, Router } from "express";
import { getMemberPermissions } from "@/middlewares/getMemberPermissions";
import projectController from "@/controllers/projectController";

const {
	inviteToProject,
    invitationStatus,
    getProjectInvites,
} = projectController;

const router = Router({ mergeParams: true });

router.patch('/:inviteId', invitationStatus as RequestHandler);
router.get('/', getMemberPermissions, getProjectInvites as RequestHandler)
router.post('/', getMemberPermissions, inviteToProject as RequestHandler);

export default router;
