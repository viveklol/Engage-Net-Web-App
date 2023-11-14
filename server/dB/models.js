import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    username: {type:String, unique:true},
    firstName: String,
    lastName: String,
    password: String,
});

const chatSchema = mongoose.Schema({
    message: String,
    senderId: { type: mongoose.Types.ObjectId, ref: 'Users' },
    receiverId: { type: mongoose.Types.ObjectId, ref: 'Users' },
    file: String,
}, {timestamps: true});

export const Users = mongoose.model('users', userSchema);
export const Chats = mongoose.model('Chats', chatSchema);
