import React from 'react';
import LoginScreen, { LoginScreenProps } from './LoginScreen';

export type LoginPageProps = LoginScreenProps;

export const LoginPage: React.FC<LoginPageProps> = (props) => {
  return <LoginScreen {...props} />;
};

export default LoginPage;
export { LoginScreen };
