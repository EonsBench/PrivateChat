document.addEventListener('DOMContentLoaded', (event) => {
    const roomList = document.getElementById('room-list');
    const createRoomButton = document.getElementById('create-room');

    const socket = io();

    createRoomButton.addEventListener('click', () => {
      fetch('/create-room', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
          const roomName = data.roomName;
          const roomItem = document.createElement('li');
          roomItem.innerHTML = `<a href="/chat/${roomName}">${roomName}</a>`;
          roomList.appendChild(roomItem);
        });
    });

    function loadRooms() {
      fetch('/rooms')
        .then(response => response.json())
        .then(rooms => {
          roomList.innerHTML = '';
          rooms.forEach(room => {
            const roomItem = document.createElement('li');
            roomItem.innerHTML = `<a href="/chat/${room}">${room}</a>`;
            roomList.appendChild(roomItem);
          });
        });
    }

    loadRooms();
  });