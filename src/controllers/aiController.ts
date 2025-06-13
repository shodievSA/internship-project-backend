import aiService from '../services/aiService';

class aiController {
  public async EnhanceText(req: any, res: any, next: any) {
    return aiService
      .Enhance(req.body.text)
      .then((result: string | null) => {
        return res.status(200).json({ enhancedVersion: result });
      })
      .catch((err) => {
        return next(new Error(err));
      });
  }
}

export default new aiController();
