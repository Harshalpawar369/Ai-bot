const userModel = require("../models/user.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


async function registerUser(req, res) {
    try {
        const { email, fullName: {firstName, lastName}, password} = req.body;

       
        const isuserAlreadyExists = await userModel.findOne({ email });
        if (isuserAlreadyExists) {
            return res.status(400).json({ message: "User already exist" });
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        
        const createdUser = await userModel.create({
            email,
            fullName: {
                firstName, lastName
            },
            password: hashedPassword,
        });

       
        const token = jwt.sign({ email }, process.env.JWT_SECRET);

        res.cookie("usertoken", token, { httpOnly: true, sameSite: 'lax' });
        return res.status(201).json({
            message: "user registred successfully",
            user: {
                email: createdUser.email,
                fullNameName: createdUser.fullName,
                _id: createdUser._id
            
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

async function loginUser(req,res) {
    const {email,password} = req.body;

    const checkUserexist = await userModel.findOne({
    email
})

if(!checkUserexist){
    return res.status(400).json({
        message: "invalid email or password"
    })
} 

const isPasswordValid = await bcrypt.compare(password, checkUserexist.password);
 
if(!isPasswordValid){
    return res.status(400).json({
        message: "invalid email or password"
    })
}

const token = jwt.sign({ email: checkUserexist.email }, process.env.JWT_SECRET);

res.cookie("usertoken", token, { httpOnly: true, sameSite: 'lax' });

res.status(200).json({
    message: "user logged-in succssefully",
    user: {
        email: checkUserexist.email,
        fullName: checkUserexist.fullName
    }
})
  
}

function logoutUSer(req,res){
    res.clearCookie("usertoken");
    res.status(200).json({
        message: "logged out successfully"
    })
}



module.exports = { 
    registerUser,
    loginUser,
    logoutUSer,
    
 };