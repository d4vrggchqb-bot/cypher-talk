document.addEventListener('DOMContentLoaded', () => {
  // 1. Set the Vercel rewrite path for the Onboarding Screen.
  // This must match the 'source' defined in vercel.json: "/onboarding".
  const onboardingPath = '/onboarding';

  // 2. Set the duration for the flash screen (3000 milliseconds = 3 seconds)
  const delayInMilliseconds = 3000;

  // 3. Use setTimeout to wait and then redirect the user
  setTimeout(() => {
    // FIX: Redirecting to the Vercel rewrite source path.
    window.location.href = onboardingPath;
  }, delayInMilliseconds)
});