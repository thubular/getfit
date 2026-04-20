import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({});

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(event, session)
            if (session?.user) {
                setIsAuthenticated(true);
                setUser(session.user);
                setLoading(false);
                await updateUserData(session.user.id);
            } else {
                setIsAuthenticated(false);
                setUser(null);
                setUserData({}); // clear the cache
                setLoading(false);
            }
        });

        // call unsubscribe to remove the callback
        return () => subscription.unsubscribe();
    }, []);

    const updateUserData = useCallback(async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user data:', error);
            return;
        }
        if (data) {
            setUserData(data);
        }
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                return { success: false, msg: error.message };
            }

            return { success: true, data: data.user };
        } catch (e) {
            let msg = e.message;
            if (msg.includes('(auth/invalid-email)')) msg = 'Invalid email'
            if (msg.includes('(auth/invalid-credential)')) msg = 'Wrong credentials'
            return { success: false, msg };
        }
    }, []);
    const logout = useCallback(async () => {
        try {
            //await signOut(auth);
            await supabase.auth.signOut();
            return { success: true }
        } catch (e) {
            return { success: false, msg: e.message, error: e };
        }
    }, []);

    const register = useCallback(async (email, password, username) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });
            console.log('data: ', data);
            console.log('error: ', error);

            if (error) return { success: false, msg: error.message };
            return { success: true, data: data.user };
        } catch (e) {
            let msg = e.message;
            if (msg.includes('(auth/invalid-email')) msg = 'Invalid email'
            if (msg.includes('(auth/email-already-in-use)')) msg = 'This email is already in use'
            return { success: false, msg };
        }
    }, []);

    // Use useMemo to prevent unnecessary re-renders for consumers
    const value = useMemo(() => ({
        user: user ? { ...user, ...userData } : null,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUserData
    }), [user, userData, isAuthenticated, loading, register, logout, updateUserData]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const result = useContext(AuthContext);

    if (!result) {
        throw new Error('useAuth must be wrapped inside AuthContextProvider');
    }
    return result;
}


