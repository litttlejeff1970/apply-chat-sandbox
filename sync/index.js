$(function () {
  //We'll use message to tell the user what's happening
  var $message = $('#message');

  //Get handle to the game board buttons
  var $buttons = $('#board .board-row button');

  //Our interface to the Sync service
  var syncClient;

  //Get an access token for the current user, passing a device ID
  //In browser-based apps, every tab is like its own unique device
  //synchronizing state -- so we'll use a random UUID to identify
  //this tab.
  $.getJSON('/token.php', function (tokenResponse) {
    //Initialize the Sync client
    syncClient = new Twilio.Sync.Client(tokenResponse.token, { logLevel: 'info' });
    syncClient.on('connectionStateChanged', function(state) {
      if (state != 'connected') {
        $message.html('Sync is not live (websocket connection <span style="color: red">' + state + '</span>)…');
      } else {
        $message.html('Sync is live!');
      }
    });

    //Let's pop a message on the screen to show that Sync is ready
    $message.html('Sync initialized!');

    //Now that Sync is active, lets enable our game board
    $buttons.attr('disabled', false);

    //This code will create and/or open a Sync document
    //Note the use of promises
    syncClient.document('SyncGame').then(function(syncDoc) {
      //Initialize game board UI to current state (if it exists)
      var data = syncDoc.value;
      if (data.board) {
        updateUserInterface(data);
      }

      //Let's subscribe to changes on this document, so when something
      //changes on this document, we can trigger our UI to update
      syncDoc.on('updated', function(event) {
        console.debug("Board was updated", event.isLocal? "locally." : "by the other guy.");
        updateUserInterface(event.value);
      });

      //Whenever a board button is clicked, update that document.
      $buttons.on('click', function (e) {
        //Toggle the value: X, O, or empty
        toggleCellValue($(e.target));

        //Send updated document to Sync
        //This should trigger "updated" events on other clients
        var data = readGameBoardFromUserInterface();
        syncDoc.set(data);

      });
    });

  });

  //Toggle the value: X, O, or empty (&nbsp; for UI)
  function toggleCellValue($cell) {
    var cellValue = $cell.html();

    if (cellValue === 'X') {
      $cell.html('O');
    } else if (cellValue === 'O') {
      $cell.html('&nbsp;');
    } else {
      $cell.html('X');
    }
  }

  //Read the state of the UI and create a new document
  function readGameBoardFromUserInterface() {
    var board = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 3; col++) {
        var selector = '[data-row="' + row + '"]' +
          '[data-col="' + col + '"]';
        board[row][col] = $(selector).html().replace('&nbsp;', '');
      }
    }

    return {board: board};
  }

  //Update the buttons on the board to match our document
  function updateUserInterface(data) {
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 3; col++) {
        var selector = '[data-row="' + row + '"]' +
          '[data-col="' + col + '"]';
        var cellValue = data.board[row][col];
        $(selector).html(cellValue === '' ? '&nbsp;' : cellValue);
      }
    }
  }

});