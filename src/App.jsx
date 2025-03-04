import { Route, Routes } from "react-router-dom"
import Login from "./Login/Login"
import { useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./config/firebase"
import { useSelector, useDispatch } from 'react-redux'
import { fetchUserInfo } from "./features/user-data/usersdata"

const App = () => {
    const currentUser = useSelector((state) => state?.usersData?.value)
  const dispatch = useDispatch()
    useEffect(() => {
        const unSub=onAuthStateChanged(auth,(user)=>{
            dispatch(fetchUserInfo(user?.uid));
        })

        return ()=>{
            unSub();
        }

    }, [])
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
        </Routes>
    )
}

export default App