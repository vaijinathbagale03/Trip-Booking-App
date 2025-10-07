import { useContext, useState } from "react"
import { UserContext } from "../UserContext"
import { Navigate, useParams } from "react-router-dom"
import axios from 'axios'
import PlacesPage from "./PlacesPage"
import AccountNav from "./AccountNav"

export default function ProfilePage() {
    const { ready, user, setUser } = useContext(UserContext)
    const [redirect, setRedirect] = useState(null)

    let { subpage } = useParams();
    if (subpage === undefined) {
        subpage = 'profile'
    }
    async function logout() {
        await axios.post('/logout');
        setUser(null);
        setRedirect('/');

    }
    if (redirect) {
        return <Navigate to={redirect} />
    }
    if (!ready) {
        return (
            <div>
                Loading....
            </div>
        )
    }
    if (ready && !user && !redirect) {
        return (
            <Navigate to={'/login'} />
        )
    }
    return (
        <div>
            <AccountNav />
            {
                subpage === 'profile' && (
                    <div className="text-center max-w-lg mx-auto">
                        Logged in as {user.name} ({user.email})
                        <button className="primary mt-2 max-w-sm" onClick={logout} >Logout</button>
                    </div>
                )
            }
            {
                subpage === 'places' && (
                    <PlacesPage />
                )
            }
        </div>
    )
}