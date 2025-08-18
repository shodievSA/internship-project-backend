import { RequestHandler, Router } from "express";
import { getMemberPermissions } from "@/middlewares/getMemberPermissions";
import teamMemberController from "@/controllers/teamMemberController";

const {
	inviteToProject,
    updateInviteStatus,
    getProjectInvites,
} = teamMemberController;

const router = Router({ mergeParams: true });

router.patch('/:inviteId', updateInviteStatus as RequestHandler);
router.get('/', getMemberPermissions, getProjectInvites as RequestHandler)
router.post('/', getMemberPermissions, inviteToProject as RequestHandler);

export default router;
