import { Request, Response } from 'express';
import memberProductivityService from '../services/memberProductivityService';
import { AppError } from '@/types';

const getMyProductivityData = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Raw projectId from params:', req.params.projectId, 'Type:', typeof req.params.projectId);
    console.log('All params:', req.params);
    console.log('All query:', req.query);
    console.log('Request URL:', req.url);
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);

    // Parse and validate projectId
    const projectId = parseInt(req.params.projectId);
    console.log('Parsed projectId:', projectId, 'Is NaN:', isNaN(projectId));

    if (isNaN(projectId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
      return;
    }

    // Get user ID from authenticated request
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Prepare filters
    const filters: any = {};
    if (req.query.timeRange) {
      filters.timeRange = req.query.timeRange;
    }

    console.log('Productivity request:', {
      userId,
      projectId,
      filters
    });

    // Get productivity data
    const productivityData = await memberProductivityService.getMemberProductivity(
      userId,
      projectId,
      filters
    );

    res.status(200).json({
      success: true,
      data: productivityData
    });

  } catch (error) {
    console.error('Productivity error:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Something went wrong'
      });
    }
  }
};

export default {
  getMyProductivityData
}; 