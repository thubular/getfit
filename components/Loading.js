import { View, Text } from 'react-native'
import React from 'react'
import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'


export default function Loading({size}) {
    return (
        <Ring size={{size}} speed={1.5} bgOpacity={0.25} />
    )
}