import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';

import ChargeUpIntro from '@/components/charge-up-intro';
import { getAppState, hydrate } from '@/data/app-store';

/** First screen: the charge-up launch animation, then the map (signed in), login, or onboarding. */
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
    // saved state loads in milliseconds; the intro runs for seconds, so this rarely waits
    hydrate.then(() => {
      const { signedIn, onboarded } = getAppState();
      router.replace(signedIn ? '/map' : onboarded ? '/login' : '/onboarding');
    });
  }, [router, navigation]);

  return <ChargeUpIntro onDone={done} />;
}
