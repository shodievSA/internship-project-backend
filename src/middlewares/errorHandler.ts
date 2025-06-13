import { NextFunction,Request , Response } from "express";

function ErrorHandler (err: Error , req : Request, res:Response , next :NextFunction): object {
	return res.status(500).json({err})
}


export default ErrorHandler