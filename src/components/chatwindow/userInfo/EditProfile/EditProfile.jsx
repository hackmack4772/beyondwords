import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { db, auth } from "../../../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, onAuthStateChanged } from "firebase/auth";
import "./editProfile.css";
import upload from "../../../../utils/upload";
import { fetchUserInfo } from "../../../../features/user-data/usersdata";

const EditProfile = ({ setShowEditMode }) => {
    const currentUser = useSelector((state) => state.user.currentUser);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        name: "",
        about: "",
        avatar: ""
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchUser = async () => {
            if (!currentUser) return;
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.id));
                if (userDoc.exists()) {
                    setUser(userDoc.data());
                    setFormData({
                        username: userDoc.data().username || "",
                        name: userDoc.data().name || "",
                        about: userDoc.data().about || "",
                        avatar: userDoc.data().avatar || "./avatar.png"
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUser();

        // Sync with Firebase Auth state
        const unsubscribe = onAuthStateChanged(auth, (updatedUser) => {
            if (updatedUser) {
                setFormData((prev) => ({
                    ...prev,
                    username: updatedUser.displayName || prev.username,
                    avatar: updatedUser.photoURL || prev.avatar
                }));
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        if (e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let avatarURL = formData.avatar;

            // Upload new avatar if changed
            if (avatarFile) {
                avatarURL = await upload(avatarFile);
            }

            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName: formData.username,
                photoURL: avatarURL
            });

            // Update Firestore user document
            await updateDoc(doc(db, "users", currentUser.id), {
                username: formData.username,
                name: formData.name,
                about: formData.about,
                avatar: avatarURL
            });

        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            // Refresh Redux store and close edit mode
            dispatch(fetchUserInfo(currentUser.id)).then(() => {
                setShowEditMode(false);
                setLoading(false);
            });
        }
    };

    return (
        <div className="editProfile">
            {user ? (

                <>
                <div className="header">
                    <button className="close" onClick={() => setShowEditMode(false)}>X</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="avatar">
                            <img src={formData.avatar} alt="Avatar" />
                            <input type="file" accept="image/*" onChange={handleAvatarChange} />
                        </div>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" />
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" />
                        <textarea name="about" value={formData.about} onChange={handleChange} placeholder="About You"></textarea>

                        <button type="submit" disabled={loading}>{loading ? "Updating..." : "Update Profile"}</button>
                    </form>
                </>


            ) : (
                <p>Loading user data...</p>
            )}
        </div>
    );
};

export default EditProfile;
