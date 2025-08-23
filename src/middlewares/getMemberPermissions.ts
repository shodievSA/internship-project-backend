import { Request, Response, NextFunction } from 'express';
import ProjectMember from '../models/projectMember';
import Role from '../models/role';
import Permission from '../models/permission';
import { Model } from 'sequelize';
import { AppError } from '@/types';

declare global {
    namespace Express {
        interface Request {
            memberPermissions?: string[];
        }
    }
}

interface ProjectMemberModel extends Model {
    Role?: {
        Permissions?: Array<{
            name: string;
        }>;
    };
}

export const getMemberPermissions = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {

    try {
        
        const projectId = req.params.projectId || req.body.projectId;

        if (!projectId) {

			throw new AppError("Project id is missing", 400, true);

        }

        const userId = (req.user as any)?.id;

        if (!userId) {

            throw new AppError("You aren't authenticated. Try to relogin.", 403, true);

        }

        const projectMember = await ProjectMember.findOne({
            where: {
                projectId: projectId,
                userId: userId,
            },
            include: [
                {
                    model: Role,
                    include: [
                        {
                            model: Permission,
                            through: { attributes: [] },
                        },
                    ],
                },
            ],
        }) as ProjectMemberModel | null;

        if (!projectMember) {

            throw new AppError("Project member not found", 404, true);

        }

        const permissions = projectMember.Role?.Permissions?.map(
            (permission) => permission.name
        ) || [];

        req.memberPermissions = permissions;

        next();

    } catch (err) {

        next(err);

    }

}; 