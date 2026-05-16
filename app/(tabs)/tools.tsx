import { View, Text } from 'react-native';
import { Colors } from '../../constants/colors';

export default function ToolsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: Colors.gold, fontSize: 24 }}>Tools</Text>
      <Text style={{ color: Colors.text2, marginTop: 8 }}>Coming soon</Text>
    </View>
  );
}
