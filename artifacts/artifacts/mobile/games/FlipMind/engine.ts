import { TargetColor } from './config';

export const generateRandomColor = (): TargetColor => {
  return Math.random() > 0.5 ? 'green' : 'red';
};

export const verifyReverseAction = (circleColor: TargetColor, pressedButton: 'green' | 'red'): boolean => {
  // اگر دایره سبز بود، کاربر باید قرمز رو زده باشه و برعکس
  if (circleColor === 'green' && pressedButton === 'red') return true;
  if (circleColor === 'red' && pressedButton === 'green') return true;
  return false;
};