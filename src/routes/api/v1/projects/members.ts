import { Router } from "express";
import projectController from '../../../../controllers/projectController';
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";

const router = Router({ mergeParams: true });

router.patch('/:memberId', getMemberPermissions, projectController.changeTeamMemberRole);
router.delete('/:memberId', getMemberPermissions, projectController.removeTeamMember);

export default router;