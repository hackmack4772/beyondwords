import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { db, auth } from "../../../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from "firebase/auth";
import "./editProfile.css";
import upload from "../../../../utils/upload";
import { fetchUserInfo } from "../../../../features/user-data/usersdata";

const EditProfile = ({ setShowEditMode }) => {
    const currentUser = useSelector((state) => state.user.currentUser);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({ username: "", email: "", avatar: "" });
    const [avatarFile, setAvatarFile] = useState(null);
    const [password, setPassword] = useState(""); // Needed for reauthentication
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
                        email: userDoc.data().email || "",
                        avatar: userDoc.data().avatar || "./avatar.png"
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUser();

        // Listen for Firebase Auth changes and refresh user data
        const unsubscribe = onAuthStateChanged(auth, (updatedUser) => {
            if (updatedUser) {
                setFormData({
                    username: updatedUser.displayName || "",
                    email: updatedUser.email || "",
                    avatar: updatedUser.photoURL || "./avatar.png"
                });
            }
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [currentUser]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        if (e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
        }
    };

    const reauthenticateUser = async () => {
        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
            await reauthenticateWithCredential(auth.currentUser, credential);
            return true;
        } catch (error) {
            console.error("Reauthentication failed:", error);
            alert("Reauthentication failed. Please check your password.");
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let avatarURL = formData.avatar;

            // Upload new avatar to Cloudinary if selected
            if (avatarFile) {
                avatarURL = await upload(avatarFile);
            }

            // Reauthenticate if email is changed
            if (formData.email !== auth.currentUser.email) {
                const success = await reauthenticateUser();
                if (!success) {
                    setLoading(false);
                    return;
                }
                await updateEmail(auth.currentUser, formData.email);
            }

            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName: formData.username,
                photoURL: avatarURL
            });

            // Update Firestore user document
            await updateDoc(doc(db, "users", currentUser.id), {
                username: formData.username,
                email: formData.email,
                avatar: avatarURL
            });

            // Force Auth state update to trigger useEffect
            auth.currentUser.reload();

        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            dispatch(fetchUserInfo(currentUser.id)).then(() => {
                setShowEditMode(false);
                setLoading(false);


            })
            
        }
    };

    return (
        <div className="editProfile">
            {user ? (
                <form onSubmit={handleSubmit}>
                    <div className="avatar">
                        <img src={formData.avatar} alt="Avatar" />
                        <input type="file" accept="image/*" onChange={handleAvatarChange} />
                    </div>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />

                    {/* Only ask for password if email is being changed */}
                    {formData.email !== auth.currentUser.email && (
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Current Password" required />
                    )}

                    <button type="submit" disabled={loading}>{loading ? "Updating..." : "Update Profile"}</button>
                </form>
            ) : (
                <p>Loading user data...</p>
            )}
        </div>
    );
};

export default EditProfile;
