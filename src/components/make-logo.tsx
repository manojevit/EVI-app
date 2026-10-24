import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Font, Palette } from '@/constants/theme';
import { MAKE_LOGOS } from '@/data/make-logos';

/** Short badge text for a brand without a logo: "BMW", "Tata Motors" → "TM". */
export const monogram = (make: string) =>
  make.length <= 4
    ? make.toUpperCase()
    : make
        .split(/[\s-]+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

/** A car brand's logo on a round white badge (falls back to its initials). */
export default function MakeLogo({ make, size = 44, selected }: { make: string; size?: number; selected?: boolean }) {
  const art = MAKE_LOGOS[make];
  const w = art ? (art.ratio > 2 ? size * 0.78 : art.ratio > 1.2 ? size * 0.66 : size * 0.6) : 0;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Palette.white,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? Palette.volt : Palette.line,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      {art?.xml ? (
        <SvgXml xml={art.xml} width={w} height={w / art.ratio} />
      ) : art?.image ? (
        <Image source={art.image} style={{ width: w, height: w / art.ratio }} contentFit="contain" />
      ) : (
        <Text style={{ fontFamily: Font.display, fontSize: size * 0.3, color: Palette.forest }} numberOfLines={1}>
          {monogram(make)}
        </Text>
      )}
    </View>
  );
}
