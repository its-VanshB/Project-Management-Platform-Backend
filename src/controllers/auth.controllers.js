import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api_response.js";
import { ApiError } from "../utils/api_error.js";
import { asyncHandler } from "../utils/async_handler.js";
import { emailVerficationMailgenContent, sendEmail } from "../utils/mail.js";
import cookieParser from "cookie-parser";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = User.findById(userId);
        const acessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return {acessToken , refreshToken};
    } catch (error) {
        throw new ApiError(
            500,
            "something went wrong while generating access token"
        );
    }
}

const registerUser = asyncHandler(
    async (req , res) => {
        const {email , username , password , role} = req.body;

        const existedUser = await User.findOne({
            $or : [{username},{email}]
        });

        if(existedUser){
            throw new ApiError(409, "user with email and username already exist");
        }

        const user = await User.create({
            email,
            password,
            username,
            isEmailVerified : false
        });

        const {unhashedToken , hashedToken , tokenExpiry} = user.generateTemporaryToken();

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpiry = tokenExpiry;

        user.save({validateBeforeSave : false});

        await sendEmail(
            {
                email : user?.email,
                subject : "Please verify your email",
                mailgenContent : emailVerficationMailgenContent(
                    user.username,
                    `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`,
                )
            }
        );

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );

        if(!createdUser){
            throw new ApiError(
                500,
                "something went wrong while registering the user"
            );
        }

        return res.status(201).json(
            new ApiResponse(
                200,
                {user : createdUser},
                "User registered successfully and verification email has been sent on your email"
            )
        );
    }
);

const login = asyncHandler(
    async (req , res) => {
        const {email , password , username} = req.body;

        if(!email){
            throw new ApiError(400,"email is required");
        }

        const user = await User.findOne({email});

        if(!user) {
            throw new ApiError(400 , "User does not exists");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if(!isPasswordValid){
            throw new ApiError(400, "Invalid Password");
        }

        const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken -emailVerification -eemailVerificationExpiry"
        );

        const options = {
            httpOnly : true,
            secure : true
        }

        return res
            .status(200)
            .cookie("accessToken" , accessToken , options)
            .cookie("refreshToken" , refreshToken , options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user : loggedInUser,
                        accessToken,
                        refreshToken
                    },
                    "User Logged in successfully"
                )
            );
    }
);

export { registerUser , login};
