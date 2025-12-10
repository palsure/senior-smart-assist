import { StyleSheet } from 'react-native';

export const appStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#333',
  },
  profileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#666',
    borderRadius: 5,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f44336',
    borderRadius: 5,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  separatorLine: {
    height: 2,
    backgroundColor: '#4CAF50',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    backgroundColor: '#fff',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  totalContributions: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 5,
  },
  totalContributionsText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#666',
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    position: 'relative',
  },
  tabButtonActive: {
    // Active state styling
  },
  tabIcon: {
    fontSize: 18,
    marginRight: 6,
    color: '#666',
  },
  tabIconActive: {
    color: '#4CAF50',
  },
  tabLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#4CAF50',
  },
  overallRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  overallRatingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  overallRatingStars: {
    fontSize: 18,
  },
  overallRatingValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  overallRatingSeparator: {
    fontSize: 16,
    color: '#999',
    marginHorizontal: 5,
  },
  totalRewardsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalRewardsValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

