import './App.css'
import { Routes, Route } from 'react-router-dom'
import IndexPage from './pages/IndexPage'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import RegisterPage from './pages/RegisterPage'
import axios from "axios";
import { UserContextProvider } from './UserContext'
import PlacesPage from './pages/PlacesPage'
import ProfilePage from './pages/ProfilePage'
import PlacesFormPage from './pages/PlacesFormPage'
import PlaceDetailPage from './pages/PlaceDetailPage'
import BookingsPage from './pages/BookingsPage'
import BookingsPageSingle from './pages/BookingPageSingle'

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<IndexPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/account' element={<ProfilePage />} />
          <Route path='/account/places' element={<PlacesPage/>} />
          <Route path='/account/places/new' element={<PlacesFormPage/>} />
          <Route path='/account/places/:id' element={<PlacesFormPage/>} />
          <Route path='/place/:id' element={<PlaceDetailPage />} />
          <Route path='/account/bookings' element={<BookingsPage />} />
          <Route path='/account/bookings/:id' element={<BookingsPageSingle />} />
        </Route>
      </Routes>
    </UserContextProvider>
  )
}

export default App
