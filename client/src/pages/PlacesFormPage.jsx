import { useEffect, useState } from "react";
import axios from "axios";
import Perks from "../components/Perks";
import PhotosUploader from "../components/PhotosUploader";
import AccountNav from "./AccountNav";
import { Navigate, useParams } from "react-router-dom";


export default function PlacesFormPage() {

    const {id}=useParams();

    const [title, setTitle] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [addedPhotos, setAddedPhotos] = useState([]);
    const [perks, setPerks] = useState([]);
    const [extraInfo, setExtraInfo] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [maxGuests, setMaxGuests] = useState('');
    const [price, setPrice] = useState('100');
    const [redirect, setRedirect] = useState(false);

    useEffect(()=>{
        if(!id)return;
        else{
            axios.get('/places/'+id).then((response)=>{
                const {data}=response;
                setTitle(data.title);
                setAddress(data.address);
                setDescription(data.description);
                setAddedPhotos(data.photos);
                setPerks(data.perks);
                setExtraInfo(data.extraInfo);
                setCheckIn(data.checkIn);
                setCheckOut(data.checkOut);
                setMaxGuests(data.maxGuests);
                setPrice(data.price);
            })
        }
    },[id])


    function inputHeader(text) {
        return (
            <h2 className="text-2xl mt-4">{text}</h2>
        )
    }
    function inputDescription(text) {
        return (
            <p className="text-gray-500 text-sm">{text}</p>
        )
    }

    function preInput(header, desc) {
        return (
            <>
                {inputHeader(header)}
                {inputDescription(desc)}
            </>
        )
    }

    async function savePlace(ev) {
        ev.preventDefault();
        const placeData={title, address, description,
            addedPhotos, perks, extraInfo,
            checkIn, checkOut, maxGuests,price}
        if(id){
            //update
            await axios.put('/places', {id, ...placeData})
        }
        else{
            //newPlace
            await axios.post('/places',placeData)
            setRedirect(true);
        }
    }

    if(redirect){
        return <Navigate to='/account/places' />
    }

    return (
        <div>
            <AccountNav />
            <form onSubmit={savePlace}>
                {preInput('Title', 'Title for your place should be short and catchy as in advertisement')}
                <input type="text" value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="title, for example- My lovely place" />

                {preInput('Address', 'Address to this place')}
                <input type="text" value={address} onChange={(ev) => setAddress(ev.target.value)} placeholder="address" />

                {preInput('Photos', 'more = better')}
                <PhotosUploader addedPhotos={addedPhotos} setAddedPhotos={setAddedPhotos} />

                {preInput('Description', 'Description of this place')}
                <textarea value={description} onChange={(ev) => setDescription(ev.target.value)} />

                {preInput('Perks', 'Select all the perks of your place')}
                <Perks selected={perks} onChange={setPerks} />

                {preInput('Extra Info', 'House,rows etc')}
                <textarea value={extraInfo} onChange={(ev) => setExtraInfo(ev.target.value)} />

                {preInput('Check in&out times', 'check in and out times, remember to have some time window for cleaning the room')}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    <div className="border p-4 rounded-2xl">
                        <h3 className="mt-2 -mb-1">Check in time</h3>
                        <input type="text" placeholder="14"
                            value={checkIn} onChange={(ev) => setCheckIn(ev.target.value)} />
                    </div>
                    <div className="border p-4 rounded-2xl">
                        <h3 className="mt-2 -mb-1">Check out time</h3>
                        <input type="text" placeholder="11"
                            value={checkOut} onChange={(ev) => setCheckOut(ev.target.value)} />
                    </div>
                    <div className="border p-4 rounded-2xl">
                        <h3 className="mt-2 -mb-1">Max number of guests</h3>
                        <input type="number"
                            value={maxGuests} onChange={(ev) => setMaxGuests(ev.target.value)} />
                    </div>
                    <div className="border p-4 rounded-2xl">
                        <h3 className="mt-2 -mb-1">Price per night</h3>
                        <input type="number"
                            value={price} onChange={(ev) => setPrice(ev.target.value)} />
                    </div>
                </div>
                <button className="primary my-4">Save</button>
            </form>
        </div>
    )
}