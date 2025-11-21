import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface DonutDatum {
  name: string;
  amount: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  size?: number; // px
  strokeWidth?: number;
  centerLabel?: string;
  legendPosition?: 'bottom' | 'right';
}

const DonutChart: React.FC<DonutChartProps> = ({ data, size = 160, strokeWidth = 24, centerLabel, legendPosition = 'bottom' }) => {
  const total = data.reduce((s, d) => s + Math.max(0, d.amount), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const opacity = anim;

  const legendItems = data.map((d) => {
    const value = Math.max(0, d.amount);
    const percent = total === 0 ? 0 : Math.round((value / total) * 100);
    return { ...d, percent, value };
  });

  const centerDiameter = Math.max(24, radius * 1.2);

  const showLegendRight = legendPosition === 'right';

  const svgElement = (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
        {total === 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={'#F0F0F0'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        )}
        {data.map((d, i) => {
            const value = Math.max(0, d.amount);
            const portion = total === 0 ? 0 : value / total;
            const dash = `${circumference * portion} ${circumference * (1 - portion)}`;
            const offset = circumference * cumulative;
            cumulative += portion;

            return (
              <Circle
                key={d.name + i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                fill="transparent"
              />
            );
          })}
        </G>
    </Svg>
  );

  return (
    <Animated.View style={[styles.container, { width: showLegendRight ? Math.max(size + 120, 260) : size, transform: [{ scale }], opacity, minHeight: size + 24 }]}>
      {showLegendRight ? (
        <View style={styles.rowRight}>
          <View style={{ position: 'relative' }}>
            {svgElement}
            <View style={[styles.center, { width: centerDiameter, height: centerDiameter, borderRadius: centerDiameter / 2, left: (size - centerDiameter) / 2, top: (size - centerDiameter) / 2 }]}>
              <Text style={[styles.centerText, { fontSize: Math.max(12, centerDiameter / 6) }]}>{centerLabel ?? (total ? total.toString() : '—')}</Text>
            </View>
          </View>
          <View style={styles.legendRight}>
            {legendItems.map((it, idx) => (
              <View key={it.name + idx} style={styles.legendRowRight}>
                <View style={[styles.legendColor, { backgroundColor: it.color }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>{it.name}</Text>
                <Text style={[styles.legendValue, { color: it.color }]}>{it.percent}%</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <>
          {svgElement}

          <View style={[styles.center, { width: centerDiameter, height: centerDiameter, borderRadius: centerDiameter / 2 }]}>
            <Text style={[styles.centerText, { fontSize: Math.max(12, centerDiameter / 6) }]}>{centerLabel ?? (total ? total.toString() : '—')}</Text>
          </View>

          {/* Legend (bottom) */}
          <View style={styles.legend}>
            {legendItems.map((it, idx) => (
              <View key={it.name + idx} style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: it.color }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>{it.name}</Text>
                <Text style={[styles.legendValue, { color: it.color }]}>{it.percent}%</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  legend: {
    marginTop: 8,
    width: '100%',
    paddingHorizontal: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  legendRight: {
    marginLeft: 12,
    width: 110,
    justifyContent: 'center',
  },
  legendRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
});

export default DonutChart;
