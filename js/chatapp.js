/**
 * ChatApp namespace
 * =================
 *
 * The ChatApp namespace contains all the other objects in this
 * application.
 */
window.ChatApp = { };

/**
 * The server to connect to
 */
window.ChatApp.serverUri = 'http://localhost:8080/';

/**
 * Message Model
 * ===================
 *
 * The message model represents a single message.
 * Messages have the following attributes:
 *   - nickName
 *   - gravatar
 *   - message
 *   - dateTime
 */
window.ChatApp.Message = Backbone.Model.extend({

});

/**
 * Message Collection 
 * ===================
 *
 * The messages collection contains the list of messages.
 */
window.ChatApp.MessageCollection = Backbone.Collection.extend({
    
    model: ChatApp.Message

});

/**
 * User Model
 * ==========
 *
 * The users model represents a single (online) user.
 * Users have the following attributes:
 *   - nickName
 *   - gravatar
 */
window.ChatApp.User = Backbone.Model.extend({


});

/**
 * User Collection 
 * ===============
 *
 * The user collection contains the list of online users.
 */
window.ChatApp.UserCollection = Backbone.Collection.extend({
    
    model: ChatApp.User

});

/**
 * Connection
 * ==========
 *
 * The connection is responsible for connecting to the server, sending
 * messages and receiving events.
 *
 * To operate correctly, the following constructor arguments must be passed:
 *   - userCollection (an instance of ChatApp.UserCollection)
 *   - messageCollection (an instance of ChatApp.MessageCollection)
 *   - nickName (the current users' nickname)
 *   - email (the current users' email address)
 *   - serverUri (location of the chat server)
 */
window.ChatApp.Connection = function(userCollection, messageCollection, nickName, email, serverUri) {

    this.userCollection = userCollection;
    this.messageCollection = messageCollection;
    this.nickName = nickName;
    this.email = email;

    if (!serverUri) { 
        serverUri = 'http://localhost:8080/';
    }
    this.serverUri = serverUri;

    var self = this;
    this.join(function() {
        self.listen();
    });

};
/**
 * Extending the Backbone 'Events' object
 */
_.extend(window.ChatApp.Connection.prototype, Backbone.Events, {

    userCollection : null,
    messageCollection : null,
    lastSequence : 0,

    /**
     * Calling the listen function will open up a long-polling connection to
     * the chat server.
     */
    listen : function() {

        var self = this;

        /**
         * The HTTP long polling request, using jQuery's ajax function
         */
        $.ajax(this.serverUri + 'eventpoll?since=' + this.lastSequence + '&nickName=' + this.nickName + '&email=' + this.email, {
            dataType : 'json',
            complete : function(jqXHR, textStatus) {
                self.listen();
            },
            success : function(data) {
                self.parseEvents(data);
            }
        });
    },

    /**
     * Calling the join function will let the server know we're here, and cause
     * the current user to be added to the userlist.
     */
    join : function(onSuccess) {

        $.ajax(this.serverUri + 'join?nickName=' + this.nickName + '&email=' + this.email, { success: onSuccess });

    },

    /**
     * The message function sends a chat-message to the server
     */
    message : function(message) {

        $.ajax(this.serverUri + 'message?nickName=' + this.nickName + '&email=' + this.email + '&message=' + message);

    },

    /**
     * parseEvent is called by listen. This function loops through a list of
     * events and call the appropriate actions on the user and message
     * collection.
     */
    parseEvents : function(events) {

        for(var ii=0;ii<events.length;ii++) {
            var event = events[ii];
            this.lastSequence = event.sequence;
            switch(event.type) {

                case 'message' :
                    console.log('MESSAGE: ' + event.nickName);
                    this.messageCollection.add({
                        message : event.message,
                        nickName : event.nickName,
                        dateTime : window.ChatApp.parseISO8601(event.dateTime),
                        gravatar : event.gravatar
                    });
                    break;

                case 'join' :
                    console.log('JOIN: ' + event.nickName);
                    this.userCollection.add({
                        nickName : event.nickName,
                        gravatar : event.gravatar
                    });
                    break;

                case 'part' :
                    console.log('PART: ' + event.nickName);
                    this.userCollection.remove(
                        this.userCollection.find(
                            function(item) { return item.get('nickName') === event.nickName; }
                        )
                    );
                    break;
                
                default :
                    console.log('Unknown event: ' + event.type);
                    break;

            }
        }

    }


});


/** Your code goes here! **/
