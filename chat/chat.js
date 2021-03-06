(function () {
	'use strict';

	var app = angular.module('webchat',[]);

	app.controller('webchatController', webchatController);

	webchatController.$inject = ['$log', '$timeout', '$http', '$q', '$sce'];

	function webchatController($log, $timeout, $http, $q, $sce) {
		var self = this;
		self.chatWindowActive = false;

		// Our interface to the Chat service
		var chatClient;

		// A handle to the "general" chat channel - the one and only channel we
		// will have in this sample app
		var generalChannel;

		// The server will assign the client a random username - store that value
		// here
		var username;
		
		// A handle to the chat frame
		var chatFrame;

		self.toggleChat = function() {
			if (self.chatWindowActive) {
				self.chatWindowActive = false;
				chatFrame.unloadChannelByContainer('#messages');
			} else {
				self.chatWindowActive = true;
				self.startChat();
			}
		};
		
		self.startChat = function () {
			self.chatWindowActive = true;
			$http.get('/token.php').then(function (response) {
				// Alert the user they have been assigned a random username
				username = response.data.identity;
				//				print('You have been assigned a random username of: ' + '<span class="me">' + username + '</span>', true);

				// Initialize the Chat client
				chatClient = new Twilio.Chat.Client(response.data.token);
				chatClient.getSubscribedChannels().then(createOrJoinGeneralChannel);
				chatClient.on('channelJoined', function (channel) {
					loadFrame(chatClient, channel);
				});

			});

		};

		var createOrJoinGeneralChannel = function () {
			// Get the general chat channel, which is where all the messages are
			// sent in this simple application
			// print('Attempting to join "general" chat channel...');
			var promise = chatClient.getChannelByUniqueName('general');
			promise.then(function (channel) {
				generalChannel = channel;
				console.log('Found general channel:');
				console.log(generalChannel);
				//setupChannel();
				generalChannel.join().then(function (channel) {
					channel.updateFriendlyName('Barksy Chat');
				});
			}).catch(function () {
				// If it doesn't exist, let's create it
				console.log('Creating general channel');
				chatClient.createChannel({
					uniqueName: 'general',
					friendlyName: 'Barksy Chat'
				}).then(function (channel) {
					console.log('Created general channel:');
					console.log(channel);
					generalChannel = channel;
					//setupChannel();
					generalChannel.join();
				});
			});
		};

		var loadFrame = function (client, channel) {
			var frameConfiguration = {
				"channel": {
					"header": {
						"visible": true,
						"image": {
							"visible": true,
							"url": "https://barksy.apply-stage.gocanvas.io/assets/barksy/logo.png"
						},
						"title": {
							"visible": true,
							"default": "Barksy"
						}
					},
					"visual": {
						"colorTheme": 'LightTheme',
						"messageStyle": 'Rounded',
						"inputAreaStyle": 'Bubble',
						"override": {
							"header": {
								"background": "#2B225B",
								"color": "#FFFFFF"
							},
							"sendButton": {
								"background": "#24bba2",
								"color": "#ffffff"
							}
						}
					},
					"windowControls": {
						"visible": false,
						"closeCallback": function (channelSid) {
							self.chatWindowActive = false;
							chatFrame.unloadChannelBySid(channelSid);
						}
					}
				}
			};
			
			chatFrame = Twilio.Frame.createChat(client, frameConfiguration);
			chatFrame.loadChannel('#messages', channel);
		};
	}

})();
