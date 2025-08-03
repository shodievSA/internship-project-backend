import { Request } from "express";
import User from "@/models/user";

interface AuthenticatedRequest extends Request {
	user: User
}

export default AuthenticatedRequest