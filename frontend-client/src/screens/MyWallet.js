import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

const WalletScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      

      {/* Balance Section */}
      <View style={styles.balanceContainer}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Coins</Text>
          <Text style={styles.balanceValue}>0</Text>
        </View>
      </View>

      {/* Top Up Button */}
      <TouchableOpacity style={styles.topUpButton}>
        <Text style={styles.topUpText}>Top Up</Text>
      </TouchableOpacity>

      {/* List Options */}
      <View style={styles.listContainer}>
        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listItemText}>Transaction History</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listItemText}>Consumption Records</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Solid black background
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 40,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 5,
  },
  headerSpacer: {
    width: 38, // Balances the back button for title centering
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 10,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
  },
  topUpButton: {
    backgroundColor: '#FF2D55',
    borderRadius: 25,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    marginHorizontal: 10,
  },
  topUpText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 0, 
  },
  listItemText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '400',
  },
});

export default WalletScreen;