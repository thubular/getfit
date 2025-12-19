import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useMemo, useCallback } from 'react';

const AuthContext = createContext();

export const AuthContextProvider = ({children})=>{
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({});

    useEffect(()=>{
        const unsub = onAuthStateChanged(auth, async (user)=>{
            console.log('got user: ', user);
            if(user) {
                setIsAuthenticated(true);
                setUser(user);
                setLoading(false);
                try {
                    await updateUserData(user.uid);
                } catch (error) {
                    console.error('Error updating user data:', error);
                }
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        });
        return unsub;
    },[]);

    const updateUserData = async (userId)=>{
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()){
            setUserData(docSnap.data());
        } else {
            console.warn('User document not found for uid:', userId);
        }
    }

    const login = useCallback(async (email, password)=>{
        try {
            const response = await signInWithEmailAndPassword(auth, email, password);
            return {success: true};
        } catch(e) {
            let msg = e.message;
            if(msg.includes('(auth/invalid-email)')) msg='Invalid email'
            if(msg.includes('(auth/invalid-credential)')) msg='Wrong credentials'
            return {success: false, msg};
        }
    }, []);
    const logout = useCallback(async ()=>{
        try {
            await signOut(auth);
            return {success: true}
        }catch(e){
            return {success: false, msg: e.message, error: e};
        }
    }, []);

    const register = useCallback(async (email, password, username, profileUrl)=> {
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            console.log('response.user :', response?.user);

            await setDoc(doc(db, "users", response?.user?.uid),{
                username,
                profileUrl,
                userId: response?.user?.uid,
                userType: 'user'
            });
            return {success: true, data: response?.user};
        } catch(e) {
            let msg = e.message;
            if(msg.includes('(auth/invalid-email')) msg='Invalid email'
            if(msg.includes('(auth/email-already-in-use)')) msg='This email is already in use'
            return {success: false, msg};
        }
    }, []);

    // Use useMemo to prevent unnecessary re-renders for consumers
    const value = useMemo(() => ({ 
        user: user ? { ...user, ...userData } :null,
        loading, 
        isAuthenticated, 
        login, 
        register, 
        logout 
    }), [user, userData, isAuthenticated]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = ()=>{
    const result = useContext(AuthContext);

    if(!result) {
        throw new Error('useAuth must be wrapped inside AuthContextProvider');
    }
    return result;
}


