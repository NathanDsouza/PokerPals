import firebase from "@firebase/app";
import "@firebase/database";
import "@firebase/auth";
import NavigationService from "./NavigationService";

import {
  CREATE_ROOM,
  PROFILE_CREATE,
  USERNAME_SET,
  USERNAME_TAKEN,
  PROFILE_CREATE_SUCCESS,
  PROFILE_CREATE_FAIL,
  UPDATE_PROFILE,
  JOIN_ROOM,
  UPDATE_ROOM
} from "./types";

function checkIfUsernameAvailable(username) {
  const usernameLower = username.toLowerCase();
  const usernamePath = `/usernames/${usernameLower}`;
  const ref = firebase.database().ref(usernamePath);
  const snapshot = ref.once("value").then(snapshot => {
    return snapshot.exists();
  });

  return snapshot;
}

export async function addProfile(dispatch, firstName, lastName, username) {
  const { currentUser } = firebase.auth();
  dispatch({ type: PROFILE_CREATE });
  const taken = await checkIfUsernameAvailable(username);
  if (!taken) {
    firebase
      .database()
      .ref(`/usernames/${username}`)
      .update({ uid: currentUser.uid })
      .then(() => {
        dispatch({ type: USERNAME_SET });
      })
      .catch(error => {
        console.log(error);
      });
  } else {
    dispatch({ type: USERNAME_TAKEN, payload: "Username taken" });
    return;
  }

  firebase
    .database()
    .ref(`/users/${currentUser.uid}`)
    .update({ firstName, lastName, username })
    .then(() => {
      dispatch({ type: PROFILE_CREATE_SUCCESS, firstName, lastName, username });
      NavigationService.resetNavigation("Welcome");
    })
    .catch(error => {
      console.log("error is ", error);
      dispatch({ type: PROFILE_CREATE_FAIL, payload: error.toString() });
    });
}

function grabRoomData(roomId) {
  return firebase
    .database()
    .ref(`/rooms/${roomId}`)
    .once("value")
    .then(function(snapshot) {
      return snapshot.val();
    });
}

export async function joinRoom(dispatch, roomId, profile) {
  const { username, firstName } = profile;
  const val = await grabRoomData(roomId);
  if (val) {
    const { startingStack, bigBlind, pot } = val;
    const { currentUser } = firebase.auth();
    const { uid } = currentUser;

    const updateRoom = {};
    updateRoom[uid] = {
      stack: startingStack,
      firstName: firstName,
      username: username,
      bigBlind: bigBlind
    };
    firebase
      .database()
      .ref(`/rooms/${roomId}/members`)
      .update(updateRoom)
      .then(() => {
        console.log("success");
        dispatch({
          type: JOIN_ROOM,
          roomId,
          startingStack,
          bigBlind,
          pot,
          uid
        });
        NavigationService.resetNavigation("Room");
      })
      .catch(error => {
        console.log("fail");
      });
  } else {
    console.log("room don't exist"); // deal w this
  }
}

export function getUserData() {
  const { currentUser } = firebase.auth();
  console.log("before");
  return firebase
    .database()
    .ref(`/users/${currentUser.uid}`)
    .once("value")
    .then(function(snapshot) {
      return snapshot.val();
    });
}

export async function setUserData(dispatch) {
  const userData = await getUserData();
  const { username, firstName, lastName, email } = userData;
  dispatch({
    type: UPDATE_PROFILE,
    username,
    firstName,
    lastName,
    email
  });
}

export async function addRoom(dispatch, stack, blind) {
  const shortid = require("shortid");
  const roomId = shortid.generate().substring(0, 5);

  const { currentUser } = firebase.auth();
  const pot = 0;
  const updateRoom = {};
  updateRoom[roomId] = {
    bigBlind: blind,
    startingStack: stack,
    host: currentUser.uid,
    pot: pot
  };

  console.log(updateRoom);

  dispatch({ type: CREATE_ROOM, pot, roomId });

  firebase
    .database()
    .ref("/rooms/")
    .update(updateRoom)
    .then(() => {
      console.log("success");
    })
    .catch(error => {
      console.log("fail");
    });
}

function checkIfRoomExists(roomId) {
  const ref = firebase.database().ref(`/rooms/${roomId}`);
  const snapshot = ref.once("value").then(snapshot => {
    return snapshot.val();
  });

  return snapshot;
}

export async function validateRoom(dispatch, roomId) {
  const snapshot = await checkIfRoomExists(roomId);
  if (snapshot) {
    const { stack, bigBlind } = snapshot;
    dispatch({
      type: UPDATE_ROOM,
      stack,
      bigBlind
    });
  } else {
    return;
  }
}

function asyncRoomListener(dispatch, roomId) {
  firebase
    .database()
    .ref(`/rooms/${roomId}`)
    .on("value", function(dataSnapshot) {
      console.log("in async call");
      const val = dataSnapshot.val();
      dispatch({ type: UPDATE_ROOM, ...val });
      return dataSnapshot.val();
    });
}

export async function fbStartRoomListener(dispatch, roomId) {
  console.log("room id is " + roomId);
  const val = await asyncRoomListener(dispatch, roomId);
  console.log("return from func");
}

export async function fbBet(dispatch, roomId, bet) {
  console.log("bet fb");
  const { currentUser } = firebase.auth();
  const { uid } = currentUser;

  const val = await grabRoomData(roomId);
  if (val) {
    const { pot, members } = val;
    const { stack } = members[uid];
    console.log("stack is " + stack);
    const newPot = parseInt(pot, 10) + parseInt(bet, 10);
    const newStack = parseInt(stack, 10) - parseInt(bet, 10);
    console.log("newStack is  " + newStack);

    firebase
      .database()
      .ref(`/rooms/${roomId}`)
      .update({ pot: newPot })
      .then(() => {
        console.log("increased pot");
      })
      .catch(error => {
        console.log("failed to bet");
      });

    firebase
      .database()
      .ref(`/rooms/${roomId}/members/${uid}`)
      .update({ stack: newStack })
      .then(() => {
        console.log("decreased stack");
      })
      .catch(error => {
        console.log("failed to decrease stack");
      });
  }
}

export async function fbWin(dispatch, roomId) {
  console.log("win fb");
  const { currentUser } = firebase.auth();
  const { uid } = currentUser;

  const val = await grabRoomData(roomId);
  if (val) {
    const { pot, members } = val;
    const { stack } = members[uid];
    console.log("stack is " + stack);
    const newStack = parseInt(pot, 10) + parseInt(stack, 10);
    console.log("newStack is  " + newStack);

    firebase
      .database()
      .ref(`/rooms/${roomId}`)
      .update({ pot: 0 })
      .then(() => {
        console.log("reset pot");
      })
      .catch(error => {
        console.log("failed to reset pot");
      });

    firebase
      .database()
      .ref(`/rooms/${roomId}/members/${uid}`)
      .update({ stack: newStack })
      .then(() => {
        console.log("added pot to stack");
      })
      .catch(error => {
        console.log("failed to add pot to stack");
      });
  }
}
