import { Fragment } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { RadarMetric } from '../data/vehicles';
import { colors } from '../styles/colors';

type RadarSeries = {
  name: string;
  color: string;
  values: RadarMetric[];
};

type RadarChartProps = {
  series: RadarSeries[];
  size?: number;
};

function point(center: number, radius: number, index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;

  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function polygonPoints(values: RadarMetric[], center: number, maxRadius: number) {
  return values
    .map((metric, index) => {
      const currentRadius = maxRadius * (metric.value / 100);
      const currentPoint = point(center, currentRadius, index, values.length);

      return `${currentPoint.x},${currentPoint.y}`;
    })
    .join(' ');
}

export function RadarChart({ series, size = 300 }: RadarChartProps) {
  const metrics = series[0]?.values ?? [];
  const center = size / 2;
  const maxRadius = size * 0.33;
  const levels = [0.25, 0.5, 0.75, 1];

  if (series.length < 2 || metrics.length === 0) {
    return (
      <View className="h-72 items-center justify-center rounded-3xl bg-[#F5F8FC]">
        <Text className="text-sm font-bold text-[#7C93AF]">Selecione dois veículos</Text>
      </View>
    );
  }

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {levels.map((level) => (
          <Circle
            key={level}
            cx={center}
            cy={center}
            r={maxRadius * level}
            fill="none"
            stroke="#D8E3F2"
            strokeWidth={1}
          />
        ))}

        {metrics.map((metric, index) => {
          const outerPoint = point(center, maxRadius, index, metrics.length);
          const labelPoint = point(center, maxRadius + 28, index, metrics.length);

          return (
            <Fragment key={metric.key}>
              <Line
                x1={center}
                y1={center}
                x2={outerPoint.x}
                y2={outerPoint.y}
                stroke="#D8E3F2"
                strokeWidth={1}
              />
              <SvgText
                x={labelPoint.x}
                y={labelPoint.y}
                fill={colors.muted}
                fontSize={10}
                fontWeight="700"
                textAnchor="middle"
              >
                {metric.label}
              </SvgText>
            </Fragment>
          );
        })}

        {series.map((item) => (
          <Polygon
            key={item.name}
            points={polygonPoints(item.values, center, maxRadius)}
            fill={item.color}
            fillOpacity={0.12}
            stroke={item.color}
            strokeWidth={2}
          />
        ))}
      </Svg>

      <View className="mt-2 flex-row flex-wrap justify-center gap-3">
        {series.map((item) => (
          <View key={item.name} className="flex-row items-center gap-2">
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            <Text className="max-w-36 text-xs font-bold text-[#00142E]" numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
