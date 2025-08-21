import { Router, RequestHandler } from "express";
import teamMemberController from "../../../../controllers/teamMemberController";
import projectController from "../../../../controllers/projectController";

const {
	changeTeamMemberRole,
	removeTeamMember,
    getMemberProductivity,
} = teamMemberController;

const { leaveProject, getProjectTeam } = projectController;

const router = Router({ mergeParams: true });

router.get('/', getProjectTeam as RequestHandler)
router.get('/:memberId', getMemberProductivity as RequestHandler);
router.patch('/:memberId', changeTeamMemberRole as RequestHandler);
router.delete('/me', leaveProject as RequestHandler);
router.delete('/:memberId', removeTeamMember as RequestHandler);

export default router;