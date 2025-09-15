import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Image, TextInput, View, Text, TouchableOpacity, Pressable, Alert } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import Loading from '../components/Loading'
import CustomKeyboardView from '../components/CustomKeyboardView.js'

export default function signIn() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const {login} = useAuth();

    const emailRef = useRef("");
    const passwordRef = useRef("");

    const handleLogin = async ()=>{
        if(!emailRef.current || !passwordRef.current) {
            Alert.alert('Sign In', "Please fill in all of the fields.");
            return;
        }
         // login process
        //setLoading(true);
        const response = await login(emailRef.current, passwordRef.current);
        //setLoading(false);
        console.log('sign in response: ', response);
        if(!response.success){
            Alert.alert('Sign In', response.msg);
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
                    <Text style={{fontSize: hp(4)}} className="font-bold tracking-wider text-center text-neutral-800">Sign In</Text>
                    {/* inputs */}
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
                    <View className="gap-3">
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
                    </View>
                    <Text style={{fontSize: hp(1.8)}} className="font-semibold text-right text-neutral-500"> Forgot password?</Text>
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
                            <TouchableOpacity onPress={handleLogin} style={{height: hp(6.5), backgroundColor: 'darkcyan'}} className="rounded-xl justify-center items-center">
                                <Text style={{fontSize: hp(2.7)}} className="text-white font-bold tracking-wider">
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                        )
                    }
                </View>

                {/* sign up text */}
                < View className="flex-row justify-center">
                    <Text style={{fontSize: hp(1.8)}} className="font-semibold text-neutral-500"> Don't have an account?</Text>
                    <Pressable onPress={()=> router.push('signUp')}>
                    <Text style={{fontSize: hp(1.8), color: 'darkcyan'}} className="font-bold text-darkcyan-500"> Sign Up</Text>
                    </Pressable>
                </View>

            </View>
        {/*</View>*/}
        </CustomKeyboardView>
    )
}