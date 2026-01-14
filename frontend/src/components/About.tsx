import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import Logo from './Logo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AboutProps {
  onBack: () => void;
}

interface WorkflowStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  delay: number;
  isLast?: boolean;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({ stepNumber, title, description, icon, delay, isLast = false }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.workflowStepHorizontal,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.stepNumberHorizontal,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.stepIcon}>{icon}</Text>
        <Text style={styles.stepNumberText}>{stepNumber}</Text>
      </Animated.View>
      <View style={styles.stepContentHorizontal}>
        <Text style={styles.stepTitleHorizontal}>{title}</Text>
        <Text style={styles.stepTextHorizontal}>{description}</Text>
      </View>
      {!isLast && <View style={styles.stepConnectorHorizontal} />}
    </Animated.View>
  );
};

const WorkflowStepVertical: React.FC<WorkflowStepProps> = ({ stepNumber, title, description, icon, delay, isLast = false }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.workflowStepVertical,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <View style={styles.stepLeftVertical}>
        <Animated.View
          style={[
            styles.stepNumberVertical,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.stepIconVertical}>{icon}</Text>
          <Text style={styles.stepNumberTextVertical}>{stepNumber}</Text>
        </Animated.View>
        {!isLast && <View style={styles.stepConnectorVertical} />}
      </View>
      <View style={styles.stepContentVertical}>
        <Text style={styles.stepTitleVertical}>{title}</Text>
        <Text style={styles.stepTextVertical}>{description}</Text>
      </View>
    </Animated.View>
  );
};

const About: React.FC<AboutProps> = ({ onBack }) => {
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const sectionFades = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Animate header
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate sections sequentially
    sectionFades.forEach((fade, index) => {
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        delay: 400 + (index * 200),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const workflowSteps = [
    {
      number: 1,
      title: 'Create Request',
      description: 'Senior citizen submits a help request with description, address, and priority level. AI automatically classifies the request type (Medical, Groceries, Transportation, etc.)',
      icon: '📝',
    },
    {
      number: 2,
      title: 'Volunteer Matching',
      description: 'System matches request with available volunteers based on skills, distance, and availability. Volunteers can see requests within their distance filter (default 50 miles).',
      icon: '🔍',
    },
    {
      number: 3,
      title: 'Accept & Assign',
      description: 'Volunteer accepts the request. System automatically assigns the volunteer and notifies the senior citizen via WebSocket. Status changes to "assigned".',
      icon: '✅',
    },
    {
      number: 4,
      title: 'In Progress',
      description: 'Volunteer starts helping and updates status to "in_progress". Real-time chat enables communication between senior and volunteer.',
      icon: '⚙️',
    },
    {
      number: 5,
      title: 'Complete & Rate',
      description: 'Volunteer marks request as "completed". System calculates and assigns reward. Senior citizen rates the volunteer (1-5 stars) with optional feedback.',
      icon: '⭐',
    },
  ];

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <Logo size={70} />
        <Text style={styles.title}>About SeniorSmartAssist</Text>
        <Text style={styles.subtitle}>Connecting seniors with caring volunteers</Text>
        <View style={styles.headerDivider} />
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: sectionFades[0] }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>✨</Text>
          <Text style={styles.sectionTitle}>Key Features</Text>
        </View>
        
        <View style={styles.featureRowContainer}>
          <View style={[styles.featureCardInline, styles.featureCardElder]}>
            <Text style={styles.featureIconInline}>🧓</Text>
            <Text style={styles.featureTitleInline}>For Senior Citizens</Text>
            <View style={styles.featureListInline}>
              <Text style={styles.featureItemInline}>AI classification</Text>
              <Text style={styles.featureItemInline}>Real-time chat</Text>
              <Text style={styles.featureItemInline}>Track requests</Text>
              <Text style={styles.featureItemInline}>Rate volunteers</Text>
            </View>
          </View>

          <View style={[styles.featureCardInline, styles.featureCardVolunteer]}>
            <Text style={styles.featureIconInline}>🤝</Text>
            <Text style={styles.featureTitleInline}>For Volunteers</Text>
            <View style={styles.featureListInline}>
              <Text style={styles.featureItemInline}>Browse requests</Text>
              <Text style={styles.featureItemInline}>Smart matching</Text>
              <Text style={styles.featureItemInline}>Track assignments</Text>
              <Text style={styles.featureItemInline}>Earn rewards</Text>
            </View>
          </View>

          <View style={[styles.featureCardInline, styles.featureCardDonor]}>
            <Text style={styles.featureIconInline}>💖</Text>
            <Text style={styles.featureTitleInline}>For Donors</Text>
            <View style={styles.featureListInline}>
              <Text style={styles.featureItemInline}>Make contributions</Text>
              <Text style={styles.featureItemInline}>General or specific</Text>
              <Text style={styles.featureItemInline}>Track donations</Text>
            </View>
          </View>

          <View style={[styles.featureCardInline, styles.featureCardAI]}>
            <Text style={styles.featureIconInline}>🤖</Text>
            <Text style={styles.featureTitleInline}>AI Features</Text>
            <View style={styles.featureListInline}>
              <Text style={styles.featureItemInline}>Auto classification</Text>
              <Text style={styles.featureItemInline}>Smart matching</Text>
              <Text style={styles.featureItemInline}>Distance filtering</Text>
              <Text style={styles.featureItemInline}>Reward calculation</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: sectionFades[1] }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🔄</Text>
          <Text style={styles.sectionTitle}>Request Workflow</Text>
        </View>
        <View style={styles.workflowContainerVertical}>
          {workflowSteps.map((step, index) => (
            <WorkflowStepVertical
              key={step.number}
              stepNumber={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              delay={index * 150}
              isLast={index === workflowSteps.length - 1}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: sectionFades[2] }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📋</Text>
          <Text style={styles.sectionTitle}>Request Types</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.requestTypesGrid}>
            <Text style={styles.requestType}>🏥 Medical Assistance</Text>
            <Text style={styles.requestType}>🛒 Groceries</Text>
            <Text style={styles.requestType}>🚗 Transportation</Text>
            <Text style={styles.requestType}>🔧 Home Maintenance</Text>
            <Text style={styles.requestType}>📦 House Shifting</Text>
            <Text style={styles.requestType}>💻 Technology Help</Text>
            <Text style={styles.requestType}>👥 Companionship</Text>
            <Text style={styles.requestType}>🚌 Commute Assistance</Text>
            <Text style={styles.requestType}>➕ Other</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: sectionFades[3] }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>💰</Text>
          <Text style={styles.sectionTitle}>Reward System</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            <Text style={styles.boldText}>Priority Levels:</Text>{'\n'}
            🚨 Urgent: $50{'\n'}
            ⚠️ High: $30{'\n'}
            📊 Medium: $20{'\n'}
            ✅ Normal: $10{'\n\n'}
            <Text style={styles.boldText}>Type Multipliers:</Text>{'\n'}
            🏥 Medical: 1.5x{'\n'}
            📦 House Shifting: 1.4x{'\n'}
            ➕ Other types: 1.0x
          </Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: sectionFades[4] }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🔒</Text>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            • Email validation and uniqueness{'\n'}
            • Age verification for seniors (60+){'\n'}
            • Request ownership validation{'\n'}
            • Secure chat messaging{'\n'}
            • CORS protection for API access
          </Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: sectionFades[5] }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🌐</Text>
          <Text style={styles.sectionTitle}>Platform Support</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.platformGrid}>
            <View style={styles.platformItem}>
              <Text style={styles.platformIcon}>✅</Text>
              <Text style={styles.platformText}>Web</Text>
            </View>
            <View style={styles.platformItem}>
              <Text style={styles.platformIcon}>✅</Text>
              <Text style={styles.platformText}>iOS</Text>
            </View>
            <View style={styles.platformItem}>
              <Text style={styles.platformIcon}>✅</Text>
              <Text style={styles.platformText}>Android</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.getStartedButton} onPress={onBack}>
          <Text style={styles.getStartedButtonText}>🚀 Get Started</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 12,
    paddingBottom: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 5,
    paddingBottom: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 3,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  headerDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333',
  },
  featureRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  featureCardInline: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    flex: 1,
    minHeight: 160,
    maxWidth: (SCREEN_WIDTH - 36) / 4,
    alignItems: 'center',
  },
  featureGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  featureCardCompact: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    width: (SCREEN_WIDTH - 36) / 2, // Account for padding and gaps
    minHeight: 130,
  },
  featureHorizontalContainer: {
    paddingVertical: 5,
    paddingRight: 15,
  },
  featureCardHorizontal: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    width: SCREEN_WIDTH * 0.82,
    marginRight: 12,
    minHeight: 200,
  },
  featureGrid: {
    gap: 15,
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  featureCardElder: {
    borderLeftColor: '#4CAF50',
  },
  featureCardVolunteer: {
    borderLeftColor: '#2196F3',
  },
  featureCardDonor: {
    borderLeftColor: '#FF9800',
  },
  featureCardAI: {
    borderLeftColor: '#9C27B0',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 6,
    textAlign: 'center',
  },
  featureIconInline: {
    fontSize: 24,
    marginBottom: 6,
    textAlign: 'center',
  },
  featureIconCompact: {
    fontSize: 22,
    marginBottom: 3,
    textAlign: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureTitleInline: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureTitleCompact: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
    textAlign: 'center',
  },
  featureTitleHorizontal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureList: {
    gap: 4,
  },
  featureListInline: {
    gap: 3,
    width: '100%',
    alignItems: 'flex-start',
  },
  featureListCompact: {
    gap: 1,
  },
  featureItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  featureItemInline: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    textAlign: 'left',
    width: '100%',
  },
  featureItemCompact: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  workflowContainerVertical: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  workflowContainerHorizontal: {
    paddingVertical: 5,
    paddingRight: 12,
  },
  workflowContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  workflowStepHorizontal: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 6,
    width: SCREEN_WIDTH * 0.65,
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
    position: 'relative',
    minHeight: 100,
  },
  workflowStepContainer: {
    marginBottom: 5,
  },
  workflowStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
  },
  stepNumberHorizontal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stepIcon: {
    fontSize: 12,
    marginBottom: 0,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepConnectorHorizontal: {
    position: 'absolute',
    right: -8,
    top: '50%',
    width: 16,
    height: 2,
    backgroundColor: '#4CAF50',
    opacity: 0.4,
    zIndex: 1,
  },
  stepConnector: {
    width: 3,
    height: 80,
    backgroundColor: '#4CAF50',
    marginTop: 10,
    marginBottom: 10,
    opacity: 0.3,
  },
  stepContentHorizontal: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  stepContent: {
    flex: 1,
    paddingTop: 8,
  },
  stepTitleHorizontal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  stepTextHorizontal: {
    fontSize: 11,
    color: '#666',
    lineHeight: 15,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  workflowStepVertical: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepLeftVertical: {
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  stepNumberVertical: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepIconVertical: {
    fontSize: 16,
    marginBottom: 1,
  },
  stepNumberTextVertical: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepConnectorVertical: {
    width: 3,
    height: 60,
    backgroundColor: '#4CAF50',
    marginTop: 6,
    marginBottom: 6,
    opacity: 0.4,
  },
  stepContentVertical: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitleVertical: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  stepTextVertical: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stepText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  requestTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  requestType: {
    fontSize: 13,
    color: '#666',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 0,
    margin: 0,
    width: (SCREEN_WIDTH - 24) / 3, // 3 columns without gaps
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  platformGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  platformItem: {
    alignItems: 'center',
  },
  platformIcon: {
    fontSize: 22,
    marginBottom: 3,
  },
  platformText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default About;
