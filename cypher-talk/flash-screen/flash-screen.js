document.addEventListener('DOMContentLoaded', () => {
  // 1. Get the path to your Onboarding Screen (obs.html)
  // The flash-screen.html is likely in the main folder, and obs.html is inside Onboarding-screen/
  const onboardingPath = '../Onboarding-screen/obs.html';

  // 2. Set the duration for the flash screen (3000 milliseconds = 3 seconds)
  const delayInMilliseconds = 3000;

  // 3. Use setTimeout to wait and then redirect the user
  setTimeout(() => {
    window.location.href = onboardingPath;
  }, delayInMilliseconds);
});