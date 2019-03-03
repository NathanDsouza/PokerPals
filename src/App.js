import React, {Component} from 'react';
import {Provider} from 'react-redux';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import {createStore, applyMiddleware} from 'redux';
import ReduxThunk from 'redux-thunk';
import reducers from './reducers';
import Home from './components/Home';
import EmailLogin from './components/EmailLogin';
import NavigationService from './actions/NavigationService'



const RootStack = createStackNavigator(
  {
    Home: {
      screen: Home,
    },
    EmailLogin: {
      screen: EmailLogin,
    },
  },
  {
    initialRouteName: 'Home',
  }
);

const AppContainer = createAppContainer(RootStack);

export default class App extends React.Component {
  render() {
    const store=(createStore(reducers, {}, applyMiddleware(ReduxThunk)));
    return(
      <Provider store={store} >
        <AppContainer 
          ref={navigatorRef => {
          NavigationService.setTopLevelNavigator(navigatorRef);
          }}
        />
      </Provider>
      );
  }
}