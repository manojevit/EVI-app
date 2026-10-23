import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';

import ChargeUpIntro from '@/components/charge-up-intro';

/** First screen: the charge-up launch animation, then onboarding. */
export default function IntroScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const left = useRef(false);

  const done = useCallback(() => {
    if (left.current) return; // skip tap + timeline end can both fire
    left.current = true;
    // When the app is opened on another screen (deep link / web URL), this screen sits
    // underneath it as the initial route; only hand off to onboarding if it's on top.
    if (!navigation.isFocused()) return;
    router.replace('/onboarding');
  }, [router, navigation]);

  return <ChargeUpIntro onDone={done} />;
}
