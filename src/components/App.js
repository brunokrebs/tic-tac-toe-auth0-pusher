import React, { Component } from "react";
import Connect from "./Connect";
import Callback from "./Callback";
import Game from "./Game";
import NotFound from "./NotFound";
import Auth from "../Auth";
import Pusher from 'pusher-js';
import "./css/App.css";

const auth = new Auth();

export default class App extends Component {
  state = {
    username: auth.getProfile().given_name || "",
    location: window.location.pathname.replace(/^\/?|\/$/g, ""),
    auth,
    pusher: new Pusher('23919cee3b1111731271', {
      authEndpoint: 'http://localhost:5000/pusher/auth',
      cluster: 'eu',
      encrypted: true
    })
  };

  render() {
    let currentComponent = "";
    switch (this.state.location) {
      case "":
        currentComponent = <Connect {...this.state} />;
        break;
      case "callback":
        currentComponent = <Callback {...this.state} />;
        break;
      case "game":
        currentComponent = this.state.auth.isAuthenticated() ? <Game {...this.state} /> : <NotFound />;
        break;
      default:
        currentComponent = <NotFound />;
    }

    return (
      <div>
        <div className="App">{currentComponent}</div>
      </div>
    );
  }
}
