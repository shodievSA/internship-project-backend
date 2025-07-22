import { RequestHandler, Router } from "express";
import { getMemberPermissions } from "@/middlewares/getMemberPermissions";
import projectController from "@/controllers/projectController";

const {
    createSprint
} = projectController;

const router = Router({ mergeParams: true });

//router.get('/', getMemberPermissions, getProjectInvites as RequestHandler)
router.post('/', getMemberPermissions, createSprint as RequestHandler);
//router.patch('/:inviteId', invitationStatus as RequestHandler);

export default router;
