import React, { Component } from "react";
import Square from "./Square";
import "./css/Game.css";

export default class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      squares: Array(9).fill(null),
      channel: {},
      myChannel: {},
      otherPlayerChannel: {},
      playerCount: 0,
      connectedPlayers: [],
      otherPlayer: "",
      firstPlayer: 0,
      marker: "",
      turn: false,
      gameOn: false,
      status: ""
    };
  }

  componentDidMount() {
    this.subscribe();
  }

  subscribe = () => {
    let username = this.props.username;
    fetch("http://localhost:5000/register", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username })
    }).then(() => {
      let the_presence_channel = this.props.pusher.subscribe(
        "presence-channel"
      );
      let the_private_channel = this.props.pusher.subscribe(
        "private-" + this.props.username
      );
      this.setState(
        { channel: the_presence_channel, myChannel: the_private_channel },
        () => {
          this.presence();
          this.listeners();
        }
      );
    });
  };

  presence = () => {
    // ----------------------------------------------------
    // Update the number of online members on successful subscription
    // ----------------------------------------------------
    this.state.channel.bind("pusher:subscription_succeeded", player => {
      this.setState({ playerCount: --player.count });
      player.each(player => {
        if (player.id !== this.props.username) {
          let tempArray = this.state.connectedPlayers.slice(0);
          tempArray.push(player.id);
          this.setState({ connectedPlayers: tempArray });
        }
      });
    });
    // ----------------------------------------------------
    // Display a notification when a new player comes online
    // ----------------------------------------------------
    this.state.channel.bind("pusher:member_added", player => {
      let increment = this.state.playerCount + 1;
      let tempArray = this.state.connectedPlayers;
      tempArray.push(player.id);
      this.setState({ playerCount: increment, connectedPlayers: tempArray });
    });

    // ---------------------------------------------------------------
    // Decrement the connectedPlayers array when a player disconnects
    // ---------------------------------------------------------------
    this.state.channel.bind("pusher:member_removed", player => {
      let decrement = this.state.playerCount - 1;
      let tempArray = this.state.connectedPlayers;
      let index = tempArray.indexOf(player.id);

      if (index > -1) {
        tempArray.splice(index, 1);
        this.setState({ connectedPlayers: tempArray, playerCount: decrement });
      }
    });
  };

  listeners = () => {
    this.props.pusher.bind("client-" + this.props.username, message => {
      let theOtherPlayerChannel = this.props.pusher.subscribe(
        "private-" + message
      );
      if (window.confirm("Do you want play a game with " + message + "?")) {
        this.setState(
          { otherPlayer: message, otherPlayerChannel: theOtherPlayerChannel },
          () => {
            this.state.otherPlayerChannel.bind(
              "pusher:subscription_succeeded",
              () => {
                this.state.otherPlayerChannel.trigger(
                  "client-game-started",
                  this.props.username
                );
              }
            );
            this.startGame(message);
          }
        );
      } else {
        this.setState({ otherPlayerChannel: theOtherPlayerChannel }, () => {
          this.state.otherPlayerChannel.bind(
            "pusher:subscription_succeeded",
            () => {
              this.state.otherPlayerChannel.trigger("client-game-declined", "");
            }
          );
        });
        this.gameDeclined();
      }
    });

    this.state.myChannel.bind("client-game-started", message => {
      this.setState({
        status: "Game started with " + message,
        firstPlayer: 1,
        turn: true,
        gameOn: true
      });
    });

    this.state.myChannel.bind("client-game-declined", () => {
      this.gameDeclined();
    });

    // ----------------------------------------------------------
    // Update the game board with the moves of the other player
    // ----------------------------------------------------------
    this.state.myChannel.bind("client-tile-update", message => {
      this.handleOtherPlayersClick(message.position);
    });

    this.state.myChannel.bind("client-game-won", message => {
      this.setState({
        turn: false
      });

      this.restart(message);
    });

    this.state.myChannel.bind("client-game-lost", message => {
      this.setState({
        turn: true
      });

      this.restart(message);
    });

    this.state.myChannel.bind("client-game-tie", message => {
      this.setState({
        turn: true
      });

      this.restart(message);
    });
  };

  startGame = message => {
    this.setState({
      status: "Game Started with " + message,
      gameOn: true
    });
  };

  gameDeclined = () => {
    this.setState({
      status: "Game declined."
    });
  };

  choosePlayerHandler = e => {
    let theOtherPlayerName = e.target.innerText;
    let theOtherPlayerChannel = this.props.pusher.subscribe(
      "private-" + theOtherPlayerName
    );
    this.setState(
      {
        otherPlayer: theOtherPlayerName,
        otherPlayerChannel: theOtherPlayerChannel
      },
      () => {
        this.state.otherPlayerChannel.bind(
          "pusher:subscription_succeeded",
          () => {
            this.state.otherPlayerChannel.trigger(
              "client-" + this.state.otherPlayer,
              this.props.username
            );
          }
        );
      }
    );
  };

  handleClick = i => {
    const squares = this.state.squares.slice();

    if (!this.state.turn || this.calculateWinner(squares) || squares[i]) {
      return;
    }

    squares[i] = this.state.firstPlayer ? "X" : "O";

    let turnChange = !this.state.turn;

    this.setState({
      squares: squares,
      turn: turnChange
    });

    this.state.otherPlayerChannel.trigger("client-tile-update", {
      position: i
    });

    this.calculateWinner(squares);
  };

  handleOtherPlayersClick = i => {
    const squares = this.state.squares.slice();

    squares[i] = !this.state.firstPlayer ? "X" : "O";

    let turnChange = !this.state.turn;

    this.setState({
      squares: squares,
      turn: turnChange
    });
  };

  calculateWinner = squares => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    const [a, b, c, d, e, f, g, h, i] = squares;

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        if (
          (squares[a] === "X" && this.state.firstPlayer) ||
          (squares[a] === "O" && !this.state.firstPlayer)
        ) {
          this.restart("You win!");
          this.state.otherPlayerChannel.trigger(
            "client-game-lost",
            "You lose!"
          );
          return squares[a];
        } else {
          this.restart("You lose!");
          this.state.otherPlayerChannel.trigger("client-game-won", "You Win!");
          return squares[a];
        }
      }
    }
    if (a && b && c && d && e && f && g && h && i) {
      this.restart("There's been a TIE");
      this.state.otherPlayerChannel.trigger(
        "client-game-tie",
        "There's been a TIE"
      );
    } else return null;
  };

  restart = x => {
    let squares = Array(9).fill(null);

    this.setState({
      status: x,
      squares: squares
    });
  };

  renderSquare(i) {
    return (
      <Square
        value={this.state.squares[i]}
        onClick={() => this.handleClick(i)}
      />
    );
  }

  render() {
    let onlinePlayers = null;
    let turn;

    if (this.state.turn) {
      turn = "Your turn";
    } else {
      turn = this.state.otherPlayer + "'s turn";
    }

    if (this.state.connectedPlayers) {
      onlinePlayers = (
        <div>
          {this.state.connectedPlayers.map((player, index) => {
            return (
              <p
                onClick={e => {
                  this.choosePlayerHandler(e);
                }}
                key={index}
              >
                {player}
              </p>
            );
          })}
        </div>
      );
    }

    return (
      <div>
        <div className="game">
          {this.state.gameOn ? (
            <div className="board-container">
              <div className="status">{turn}</div>
              <div className="board-row">
                {this.renderSquare(0)}
                {this.renderSquare(1)}
                {this.renderSquare(2)}
              </div>
              <div className="board-row">
                {this.renderSquare(3)}
                {this.renderSquare(4)}
                {this.renderSquare(5)}
              </div>
              <div className="board-row">
                {this.renderSquare(6)}
                {this.renderSquare(7)}
                {this.renderSquare(8)}
              </div>
            </div>
          ) : null}

          <div className="sideBar">
            <div className="availablePlayers">
              <p>{this.state.playerCount} online player(s) </p>
              <hr />
              {onlinePlayers}
            </div>
            <div className="gameStatus"> {this.state.status}</div>
          </div>
        </div>
      </div>
    );
  }
}
