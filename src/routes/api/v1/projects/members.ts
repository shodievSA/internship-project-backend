import { Router, RequestHandler } from "express";
import { getMemberPermissions } from "@/middlewares/getMemberPermissions";
import projectController from "../../../../controllers/projectController";

const {
	changeTeamMemberRole,
	leaveProject,
	removeTeamMember,
    getMemberProductivity,
    getTeamOfProject
} = projectController;

const router = Router({ mergeParams: true });

router.get('/', getTeamOfProject as RequestHandler)
router.get('/:memberId', getMemberPermissions, getMemberProductivity as RequestHandler);
router.patch('/:memberId', getMemberPermissions, changeTeamMemberRole as RequestHandler);
router.delete('/me', getMemberPermissions, leaveProject as RequestHandler);
router.delete('/:memberId', getMemberPermissions, removeTeamMember as RequestHandler);

export default router;