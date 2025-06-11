import userService from '../services/user-service';


class UserController {
  public getMe(req: any, res: any, next: any): any | undefined {
    return userService
      .getUserData(req.user.id)
      .then((userData) => {
        return res.status(200).json({user:userData});
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        return { error: 'Internal server error' };
      });
  }
}

export default new UserController();