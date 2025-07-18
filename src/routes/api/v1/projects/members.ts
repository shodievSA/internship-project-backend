import { Router, RequestHandler } from "express";
import projectController from "../../../../controllers/projectController";

const {
	changeTeamMemberRole,
	leaveProject,
	removeTeamMember,
    getMemberProductivity,
} = projectController;

const router = Router({ mergeParams: true });

router.get('/:memberId', getMemberProductivity as RequestHandler);
router.patch('/:memberId', changeTeamMemberRole as RequestHandler);
router.delete('/me', leaveProject as RequestHandler);
router.delete('/:memberId', removeTeamMember as RequestHandler);

export default router;