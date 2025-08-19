import { RequestHandler, Router } from "express";
import { getMemberPermissions } from "@/middlewares/getMemberPermissions";
import teamMemberController from "@/controllers/teamMemberController";
import userController from "@/controllers/userController";
import projectController from "@/controllers/projectController";

const {
    updateUserInviteStatus,
} = userController;

const {
    sendProjectInvite,
    getProjectInvites,
} = projectController;

const router = Router({ mergeParams: true });

router.patch('/:inviteId', updateUserInviteStatus as RequestHandler);
router.get('/', getMemberPermissions, getProjectInvites as RequestHandler)
router.post('/', getMemberPermissions, sendProjectInvite as RequestHandler);

export default router;
