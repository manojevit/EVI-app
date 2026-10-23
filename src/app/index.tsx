import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';

import ChargeUpIntro from '@/components/charge-up-intro';

/** First screen: the charge-up launch animation, then onboarding. */
export default function IntroScreen() {
  const router = useRouter();
  const left = useRef(false);

  const done = useCallback(() => {
    if (left.current) return; // skip tap + timeline end can both fire
    left.current = true;
    router.replace('/onboarding');
  }, [router]);

  return <ChargeUpIntro onDone={done} />;
}
