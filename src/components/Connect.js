import React, { Component } from "react";
import "./css/Connect.css";

export default class Connect extends Component {
  render() {
    return (
      <div className="connectBox">
        <img
          src="https://i.pinimg.com/originals/27/ff/ef/27ffef483a50588e27e9d86d4cbd55fb.png"
          alt="game logo"
        />

        {!this.props.auth.isAuthenticated() ? (
          <div>
            <hr />
            <p> Welcome to this multiplayer game built upon React. </p>
            <p> To play, connect below.</p>
            <hr />

            <button onClick={this.props.auth.login}>Connect</button>
          </div>
        ) : (
          <div>
            <hr />
            <p> Welcome back, {this.props.username}! </p>
            <p> To go to the game screen, click the button below</p>
            <hr />

            <button
              onClick={() => {
                window.location.pathname = "/game";
              }}
            >
              Play
            </button>
          </div>
        )}
      </div>
    );
  }
}
