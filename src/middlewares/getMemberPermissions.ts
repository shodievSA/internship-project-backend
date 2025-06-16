import { Request, Response, NextFunction } from 'express';
import ProjectMember from '../models/projectMember';
import Role from '../models/role';
import Permission from '../models/permission';
import { Model } from 'sequelize';

// Extend Express Request type to include memberPermissions
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
        // Get project ID from request params or body
        const projectId = req.params.projectId || req.body.projectId;

        if (!projectId) {
            res.status(400).json({ message: 'Project ID is required' });
            return;
        }

        // Get the authenticated user's ID
        const userId = (req.user as any)?.id;

        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        // Find the project member record
        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                user_id: userId,
            },
            include: [
                {
                    model: Role,
                    include: [
                        {
                            model: Permission,
                            through: { attributes: [] }, // Exclude junction table attributes
                        },
                    ],
                },
            ],
        }) as ProjectMemberModel | null;

        if (!projectMember) {
            res.status(404).json({ message: 'Project member not found' });
            return;
        }

        // Extract permissions from the role
        const permissions = projectMember.Role?.Permissions?.map(
            (permission) => permission.name
        ) || [];

        console.log('User Permissions:', permissions); // Log 4: Check final permissions


        // Attach permissions to request object
        req.memberPermissions = permissions;

        next();
    } catch (error) {
        console.error('Error in getMemberPermissions middleware:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}; 