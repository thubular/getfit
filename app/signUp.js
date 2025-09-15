import { Octicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Image, TextInput, View, Text, TouchableOpacity, Pressable, Alert } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
//import Loading from '../components/Loading'
import CustomKeyboardView from '../components/CustomKeyboardView.js'
import { useAuth } from '../context/authContext';

export default function signUp() {
    const router = useRouter();
    const {register} = useAuth();
    const [loading, setLoading] = useState(false);

    const emailRef = useRef("");
    const passwordRef = useRef("");
    const usernameRef = useRef("");
    const profileRef = useRef("");

    const handleRegister = async ()=>{
        if(!emailRef.current || !passwordRef.current || !usernameRef.current || !profileRef.current) {
            Alert.alert('Sign Up', "Please fill in all of the fields.");
            return;
        }
        //setLoading(true);
        // reister process
        let response = await register(emailRef.current, passwordRef.current, usernameRef.current, profileRef.current);
        //setLoading(false);

        console.log('got result: ', response);
        if(!response.success){
            Alert.alert('Sign Up', response.msg);
        }

    }
    return (
        //<View className="flex-1">
        <CustomKeyboardView>
            <StatusBar style="dark" />
            <View style={{paddingTop: hp(8), paddingHorizontal: wp(5)}} className="flex-1 gap-12">
                {/* signIn image */}
                <View className="items-center">
                    <Image style={{height: hp(25)}} resizeMode='contain' source={require('../assets/images/getfit30-logo.png')} />
                </View>
                <View className="gap-4">
                    <Text style={{fontSize: hp(4)}} className="font-bold tracking-wider text-center text-neutral-800">Sign Up </Text>
                    {/* inputs */}
                    <View style={{height: hp(7)}} className="flex-row gap-4 px-4 bg-neutral-100 items-center rounded-xl">
                        <Feather name="user" size={hp(2.7)} color="gray" />
                        <TextInput
                            onChangeText = {value=> usernameRef.current=value}
                            style={{fontSize: hp(2)}}
                            className="flex-1 font-semibold text-neutral-700"
                            placeholder='Username'
                            placeholderTextColor={'gray'}
                        />
                    </View>
                    <View style={{height: hp(7)}} className="flex-row gap-4 px-4 bg-neutral-100 items-center rounded-xl">
                        <Octicons name="mail" size={hp(2.7)} color="gray" />
                        <TextInput
                            onChangeText = {value=> emailRef.current=value}
                            style={{fontSize: hp(2)}}
                            className="flex-1 font-semibold text-neutral-700"
                            placeholder='Email address'
                            placeholderTextColor={'gray'}
                        />
                    </View>
                    <View style={{height: hp(7)}} className="flex-row gap-4 px-4 bg-neutral-100 items-center rounded-xl">
                        <Octicons name="lock" size={hp(2.7)} color="gray" />
                        <TextInput
                            onChangeText = {value=> passwordRef.current=value}
                            style={{fontSize: hp(2)}}
                            className="flex-1 font-semibold text-neutral-700"
                            placeholder='Password'
                            secureTextEntry
                            placeholderTextColor={'gray'}
                        />
                    </View>
                    <View style={{height: hp(7)}} className="flex-row gap-4 px-4 bg-neutral-100 items-center rounded-xl">
                        <Feather name="image" size={hp(2.7)} color="gray" />
                        <TextInput
                            onChangeText = {value=> profileRef.current=value}
                            style={{fontSize: hp(2)}}
                            className="flex-1 font-semibold text-neutral-700"
                            placeholder='Profile url'
                            placeholderTextColor={'gray'}
                        />
                    </View>
                </View>
                {/* submit button */}
                {/* TODO: figure out why it won't take the color of darkcyan */}
                <View>
                    {
                        loading? (
                            <View className="flex-row justify-center">
                                {/* TODO: FIX LOADING ANIMATION */}
                                {/*<Loading size={hp(6.5)}/>*/}
                            </View>
                        ):(
                            <TouchableOpacity onPress={handleRegister} style={{height: hp(6.5), backgroundColor:'darkcyan'}} className="rounded-xl justify-center items-center">
                                <Text style={{fontSize: hp(2.7)}} className="text-white font-bold tracking-wider">
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        )
                    }
                </View>

                {/* sign up text */}
                < View className="flex-row justify-center">
                    <Text style={{fontSize: hp(1.8)}} className="font-semibold text-neutral-500"> Already have an account?</Text>
                    <Pressable onPress={()=> router.push('signIn')}>
                    <Text style={{fontSize: hp(1.8), color: 'darkcyan'}} className="font-bold text-darkcyan-500"> Sign In</Text>
                    </Pressable>
                </View>

            </View>
        {/*</View>*/}
        </CustomKeyboardView>
    )
}