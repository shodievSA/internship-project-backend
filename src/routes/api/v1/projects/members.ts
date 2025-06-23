import { Router, RequestHandler } from "express";
import projectController from "../../../../controllers/projectController";
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";

const {
	changeTeamMemberRole,
	leaveProject,
	removeTeamMember
} = projectController;

const router = Router({ mergeParams: true });

router.patch('/:memberId', getMemberPermissions, changeTeamMemberRole as RequestHandler);
router.delete('/me', getMemberPermissions, leaveProject as RequestHandler);
router.delete('/:memberId', getMemberPermissions, removeTeamMember as RequestHandler);

export default router;