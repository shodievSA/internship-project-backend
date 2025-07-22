import { Router, RequestHandler } from "express";
import projectController from "../../../../controllers/projectController";
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";

const {
	changeTeamMemberRole,
	leaveProject,
	removeTeamMember,
    getMemberProductivity,
    getTeamOfProject
} = projectController;

const router = Router({ mergeParams: true });

router.get('/', getTeamOfProject as RequestHandler)
router.get('/:memberId', getMemberProductivity as RequestHandler);
router.patch('/:memberId', changeTeamMemberRole as RequestHandler);
router.delete('/me', leaveProject as RequestHandler);
router.delete('/:memberId', removeTeamMember as RequestHandler);

export default router;