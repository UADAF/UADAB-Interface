const $ = jQuery = require("jquery");
const remote = require("electron").remote
let socket;
let self = {};

$(".cmd-send").on('click', (event) => {
    event.preventDefault();
    if($("#cmd-input").val() !== undefined && $("#cmd-input").val() !== "") {
        send($("#cmd-input").val());
    }
});
$(".close").on('click', (event) => {
    event.preventDefault();
    remote.app.quit();
});
$(".minimize").on('click', (event) => {
    event.preventDefault();
    remote.getCurrentWindow().minimize();
});

$(".cmd-input").keyup(function(event) {
    if (event.keyCode === 13 && $(".cmd-input").val() !== "") {
        $(".cmd-send").click();
    }
});

socket = tryToConnect();

function tryToConnect() {
    let socket = new WebSocket("ws://127.0.0.1:8080/web");
    socket.onopen = onOpen;
    return socket;
}
// @Callback
function onOpen() {
    $(".status>.text").html("Connection opened: " + socket.url);
    appendMessage(createMessage("info","Connection Opened!"));
    socket.onmessage = (message) => {
        let status = JSON.parse(message.data)["status"];
        console.log(message.data);
        console.log(status);
        self["avatarUrl"] = status["avatarUrl"];
        self["name"] = status["name"];
        self["id"] = status["id"];
        socket.onerror = onError;
        socket.onmessage = onMessage;
        socket.onclose = onClose;  
    };
    socket.send("status");
}

// @Callback
function onClose(reason) {
    $(".status>.text").html("Connection errored: " + reason.reason);
    appendMessage(createMessage("info","Connection closed by reason: " + reason.reason));
}

// @Callback
function onError(error) {
    $(".status>.text").html("Connection errored: " + error);
    appendMessage(createMessage("info","Connection error!"))
}

// @Callback
function onMessage(message) {
    if(!handleMessage(message.data)) {
        appendMessage(createMessage("incoming", message.data));
    }
}

// @Callback
function onSend(text) {
    if(!handleOutcoming(text)) {
        appendMessage(createMessage("outcoming", text));  
    }
    $("#cmd-input").val("");
}

function send(text) {
    onSend(text);
    if(text === "#close") {
        socket.close();
        socket = undefined;
        return;
    }else if(text === "#open") {
        socket = tryToConnect();
    }
    socket.send(text);
}

function createMessage(type, text) {
    return `
     <div class="message ${type}">
         <div class="text">${text}</div>
    </div>`;
}

function createStatus(status) {
    let upt = new Date(new Date().getTime() - (status["startTime"]));
    return `
    <div class="message status">
        <div class="text">Monitoring System...</div>
        <div class="info">
            <div class="mem">Memory: <span>${status["mem"]}%</div>
            <div class="state">State: <span>${status["state"]}</div>
            <div class="users">Users: <span>${status["users"]}</div>
            <div class="uptime">Uptime: <span>${upt.getHours()-3} hours ${upt.getMinutes()} minutes ${upt.getSeconds()} seconds</div>
            <img class="avatar" src="${status["avatarUrl"]}" />
        </div>
    </div>
    `;
}

function createUser(user) {
    if(user["state"] === "FOUND") {
        return `
            <div class="message user">
                <div class="text">Monitoring users...</div>
                <div class="user-info">
                    <div class="img">
                        <img src="${user["avatar"]}" />
                        <div class="discriminator">#${user["discriminator"]}</div> 
                    </div>
                    <div class="alias">Alias: <span>${user["name"]}</span></div>
                    <div class="classification">Classification: <span>${user["class"]}</span></div>
                    <div class="ssn">SSN: <span>${user["ssn"]}</span></div>
                    <div class="real-name">Real Name: <span>${user["discordName"]}</span></div>
                    <div class="id">ID: <span>${user["discordId"]}</span></div>
                </div>
                <div class="line"></div>
                    <div class="user-controls">
                    <div class="user-reclass" user-name="${user["name"]}" onclick="$('#cmd-input').val('reclass$${user["name"]}:'); $('#cmd-input').focus()">Reclass</div>
                </div>
            </div>`;
    }else{
        return `
            <div class="message user">
                <div class="text">Monitoring users...<br />Search complate: User not found!</div>
            </div>
        `;
    }
}

function createDMessage(type, dmessage) {
    let display = "flex";
    if(type == "outcoming") {
        display = "none";
    }
    return `
        <div class="message dmessage ${type}">
            <img src="${dmessage["authorAvatar"]}">
            <div class="info">
                <div class="author">${dmessage["authorName"]}<span>#${dmessage["authorId"]}</span></div>
                <div class="text">${dmessage["text"]}</div>
                <div class="id">G:${dmessage["guild"]} C:${dmessage["channel"]}</div>
                <div style="display: ${display}" class="message-controls"><div onclick="$('#cmd-input').val('user$${dmessage["authorName"]}'); $('#cmd-input').focus(); $('.cmd-send').click()" class="monitor">Monitor</div><div class="reply" onclick="$('#cmd-input').val('msg$${dmessage["guild"]}:${dmessage["channel"]}:'); $('#cmd-input').focus()">Reply</div><div class="remove">Remove</div>
            </div>
        </div>
    `;
}

function localizeState(state) {
    switch(state) {
        case "CMD_NOT_FOUND": return "Command Not Found";
        case "SUCCESS": return "Success";
        case "USR_NOT_FOUND": return "User Not Found";
        case "CLS_NOT_FOUND": return "Classification not found";
        case "ALREADY_CONNECTED": return "Socket already connected";
        default: return state;
    }
}


function appendMessage(msg) {
    $(".messages").append(msg);
}

function handleMessage(text) {
    let json = JSON.parse(text);
    if(typeof json === "object")  {
        if(json["status"] !== undefined) {
            let status = json["status"];
            appendMessage(createStatus(status));
            return true;
        }else if(json["userInfo"] !== undefined) {
            let user = json["userInfo"];
            appendMessage(createUser(user));
            return true;
        }else if(json["message"] !== undefined) {
            let message = json["message"];
            if(message["text"] !== "" && message["authorId"] !== self.id) {
                 appendMessage(createDMessage("incomign", message));
            }
            return true;
        }else if(json["response"] !== undefined) {
            let response = json["response"];
            appendMessage(createMessage("incoming", localizeState(response["state"])))
            return true;
        }else if(json["music"] !== undefined) {
            let music = json["music"];
        }
    }
    return false;
}

function handleOutcoming(text) {
    let cmd = text.split("$");
    if(cmd[0] === "msg") {
        let args = cmd[1].split(":");
        appendMessage(createDMessage("outcoming",{
            authorAvatar: self.avatarUrl,
            authorName: self.name,
            authorId: self.id,
            text: args[2],
            guild: args[0],
            channel: args[1]
        }));
        return true;
    }
    return false;
}