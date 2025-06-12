import aiService from '../services/aiService';

class aiController {
  public async EnhanceText(req: any, res: any, next: any) {
    const { text, modelCount = 0 } = req.body;
    return aiService
      .Enhance(text, modelCount)
      .then((result: string | null) => {
        return res.status(200).json({ text: result });
      })
      .catch((err) => {
        return next(new Error(err));
      });
  }
}

export default new aiController();
