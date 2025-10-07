import express from 'express'
import { PORT } from './config.js'
import mongoose from 'mongoose'
import cors from "cors";
import 'dotenv/config';
import User from './models/User.js';
import Place from './models/Places.js';
import Booking from './models/Booking.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import imageDownloader from 'image-downloader';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import mime from 'mime-types';

const bcryptSalt = bcrypt.genSaltSync(12);
const jwtSecret = "muskaanToken";

const bucket="muskaan-booking-app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express()

app.use(express.json())

app.use(cookieParser())

app.use('/uploads', express.static(__dirname + '/uploads'))

app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173'
}))



async function uploadToS3(path,originalFilename,mimetype){
    const client = new S3Client({
        region: 'us-east-1',
        credentials :{
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
    })
    const parts=originalFilename.split('.')
    const ext=parts[parts.length -1];
    const newFilename=Date.now()+'.'+ext;

    const data = await client.send(new PutObjectCommand({
        Bucket : bucket,
        Body : fs.readFileSync(path),
        Key : newFilename,
        ContentType : mimetype,
        ACL : 'public-read',
    }));

    return `https://${bucket}.s3.amazonaws.com/${newFilename}`
}

function getUserDataFromReq(req){
    return new Promise((resolve,reject)=>{
        jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            resolve(userData);
        })
    })
}

app.get('/api/test', (req, res) => {
    res.json("test ok")
})

app.post('/api/register', async (req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const { name, email, password } = req.body;
    try {
        const userDoc = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt),
        })
        res.json({ userDoc });
    } catch (error) {
        res.status(422).json(error)

    }
})

app.post('/api/login', async (req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email })
    if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
            jwt.sign({
                email: userDoc.email,
                id: userDoc._id,
            }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json(userDoc);

            })

        }
        else {
            res.status(422).json("password not ok");
        }
    }
    else {
        res.json("User not found");
    }
})

app.get('/api/profile', async(req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const { name, email, _id } = await User.findById(userData.id);
            res.json({ name, email, _id });
        })
    }
    else {
        res.json(null);
    }
})

app.post('/api/logout', (req, res) => {
    res.cookie('token', '').json(true)
})


app.post('/api/upload-by-link', async (req, res) => {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';

    await imageDownloader.image({
        url: link,
        dest:'/tmp/' + newName,
    });
    const url = await uploadToS3('/tmp/'+newName, newName,mime.lookup('/tmp/' + newName))
    res.json(url);
})


const photosMiddleware = multer({ dest: '/tmp' });
app.post('/api/upload', photosMiddleware.array('photos', 100), async(req, res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
        const { path, originalname,mimetype } = req.files[i];
        const url = await uploadToS3(path,originalname,mimetype);
        uploadedFiles.push(url);
    }

    res.json(uploadedFiles)
    // res.json(req.files);
})

app.post('/api/places', async(req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const { token } = req.cookies;
    const { title, address, description,
        addedPhotos, perks, extraInfo,
        checkIn, checkOut, maxGuests,price } = req.body
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.create({
            owner: userData.id,
            title, address, description,
            photos: addedPhotos, perks, extraInfo,
            checkIn, checkOut, maxGuests,price
        })
        res.json(placeDoc);
    })

})

app.get('/api/user-places', async(req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const { token } = req.cookies;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const { id } = userData;
        res.json(await Place.find({ owner: id }))
    })
})

app.get('/api/places/:id', async (req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const { id } = req.params;
    res.json(await Place.findById(id));
})

app.put('/api/places', async (req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const { token } = req.cookies;
    const { id, title, address, description,addedPhotos, perks, extraInfo,checkIn, checkOut, maxGuests ,price} = req.body
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.findById(id);
        if (userData.id === placeDoc.owner.toString()) {
            placeDoc.set({
                title, address, description,photos: addedPhotos,
                 perks, extraInfo,checkIn, checkOut, maxGuests, price
            })
            await placeDoc.save();
            res.json("ok");
        }
    })

})


app.get('/api/places', async (req,res) => {
    await mongoose.connect(process.env.MONGO_URL);
    res.json(await Place.find());
})

app.post('/api/bookings', async(req,res)=>{
    await mongoose.connect(process.env.MONGO_URL);
    const userData=await getUserDataFromReq(req)
    const {place,checkIn,checkOut,numberOfGuests,name,phone,price} = req.body;
    Booking.create({
        place,checkIn,checkOut,numberOfGuests,name,phone,price,
        user:userData.id
    }).then((doc)=>{
        res.json(doc);
    }).catch((err)=>{
        throw err;
    })
})



app.get('/api/bookings',async(req,res)=>{
    await mongoose.connect(process.env.MONGO_URL);
    const userData = await getUserDataFromReq(req);
    res.json(await Booking.find({user:userData.id}).populate('place'))
})

app.listen(PORT, () => {
    console.log(`App is listening on port- ${PORT}`)
});