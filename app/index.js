import { ActivityIndicator, View } from 'react-native';

export default function StartPage() {
  return (
    <View className="flex-1 justify-center">
        <ActivityIndicator size="large" color="gray" />
    </View>
  )
}