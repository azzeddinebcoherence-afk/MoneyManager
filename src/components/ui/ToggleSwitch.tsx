// src/components/ui/ToggleSwitch.tsx - VERSION CORRIGÉE
import React from 'react';
import { Animated, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';

interface ToggleSwitchProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isEnabled,
  onToggle,
  size = 'medium',
  disabled = false
}) => {
  const toggleAnimation = React.useRef(new Animated.Value(isEnabled ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(toggleAnimation, {
      toValue: isEnabled ? 1 : 0,
      useNativeDriver: false,
      damping: 15,
      stiffness: 120,
    }).start();
  }, [isEnabled, toggleAnimation]);

  const handleToggle = () => {
    if (!disabled) {
      onToggle(!isEnabled);
    }
  };

  const getSwitchStyle = (): ViewStyle[] => {
    const baseStyle = [styles.switch];
    
    switch (size) {
      case 'small':
        return [...baseStyle, styles.smallSwitch];
      case 'large':
        return [...baseStyle, styles.largeSwitch];
      default:
        return [...baseStyle, styles.mediumSwitch];
    }
  };

  const getThumbStyle = (): ViewStyle[] => {
    const baseStyle = [styles.thumb];
    
    switch (size) {
      case 'small':
        return [...baseStyle, styles.smallThumb];
      case 'large':
        return [...baseStyle, styles.largeThumb];
      default:
        return [...baseStyle, styles.mediumThumb];
    }
  };

  const translateX = toggleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, getThumbPosition()]
  });

  function getThumbPosition(): number {
    switch (size) {
      case 'small':
        return 18;
      case 'large':
        return 26;
      default:
        return 22;
    }
  }

  const getTrackColor = (): string => {
    if (disabled) {
      return isEnabled ? 'rgba(138, 43, 226, 0.5)' : '#E5E5EA';
    }
    return isEnabled ? '#8A2BE2' : '#E5E5EA';
  };

  const getThumbColor = (): string => {
    if (disabled) {
      return isEnabled ? 'rgba(255, 255, 255, 0.7)' : '#F2F2F7';
    }
    return '#FFFFFF';
  };

  return (
    <TouchableWithoutFeedback onPress={handleToggle}>
      <View style={[getSwitchStyle(), { backgroundColor: getTrackColor() }]}>
        <Animated.View
          style={[
            getThumbStyle(),
            {
              backgroundColor: getThumbColor(),
              transform: [{ translateX }],
              shadowColor: isEnabled ? '#8A2BE2' : '#000',
              shadowOpacity: isEnabled ? 0.3 : 0.1,
              shadowRadius: isEnabled ? 4 : 2,
              shadowOffset: {
                width: 0,
                height: isEnabled ? 2 : 1,
              },
              elevation: isEnabled ? 3 : 1,
            }
          ]}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  switch: {
    borderRadius: 20,
    justifyContent: 'center',
  },
  smallSwitch: {
    width: 40,
    height: 20,
  },
  mediumSwitch: {
    width: 52,
    height: 28,
  },
  largeSwitch: {
    width: 60,
    height: 32,
  },
  thumb: {
    borderRadius: 16,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
  },
  smallThumb: {
    width: 16,
    height: 16,
  },
  mediumThumb: {
    width: 24,
    height: 24,
  },
  largeThumb: {
    width: 28,
    height: 28,
  },
});

export default ToggleSwitch;