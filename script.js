/*************************************************************************************
** Global Variables
*************************************************************************************/
var publicProfile = [  'id', 'cover', 'name', 'first_name', 'last_name', 'age_range', 'link',
                        'gender', 'locale', 'picture', 'timezone', 'updated_time', 'verified', 'email'  ]
var accessToken;


/*************************************************************************************
** HTML Helper functions
** These are some simple functions that make HTML manipulation easier.
*************************************************************************************/
function makeBold(str) {
  return '<strong>' + str + '</strong>';
}

function populateDiv(id, key, val) {
  document.getElementById(id).innerHTML = makeBold(key) + val;
}

function removeChildren(parent) {
  var p = document.getElementById(parent);
  while (p.firstChild) {
    p.removeChild(p.firstChild);
  }
}

function clearData() {
  removeChildren("authResponseData");
  removeChildren("userData");
  removeChildren("permissionData");
  removeChildren("friendData");
}

function createAndAppendDiv(id, parent, key, val) {
  var newDiv = document.createElement("div");
  parent.appendChild(newDiv);
  newDiv.id = id;
  populateDiv(newDiv.id, key, val);
}



/*************************************************************************************
** Facebook SDK
** This is the Facebook SDK. This is where the SDK is initialized.
*************************************************************************************/
window.fbAsyncInit = function() {
  FB.init({
    appId      : '1908564342762785',
    cookie     : true,
    xfbml      : true,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();

  FB.Event.subscribe('auth.statusChange', statusChange);
}

function statusChange(response) {
  console.log("Login status changed");
  checkStatus(response);
}

/*************************************************************************************
** checkStatus()
** This function is called by the callback method statusChange. It retrieves the
** new login status. If the user is connected, then it fetches and displays the
** user data. If not, it clears the display.
*************************************************************************************/
function checkStatus(response) {
  FB.getLoginStatus(function (response) {
    if (response.status === 'connected') {
      populateDiv('status', 'you are connected', '');
      accessToken = response.authResponse.accessToken;
      getAuthResponseData(response);
      getPublicProfileData(response);
      getPermissionData(response);
      getFriendData(response);
    }
    else if (response.status === 'not_authorized') {
      populateDiv('status', 'you are not authorized (you are signed into FB, but you need to authorize access)', '');
      clearData();
    }
    else {
      populateDiv('status', 'not logged into Facebook', '');
      clearData();
    }
  });
}

/*************************************************************************************
** Facebook SDK
** This loads the Facebook SDK.
*************************************************************************************/
(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   //js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.9&appId=1908564342762785";
   js.src = "//connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));


 /*************************************************************************************
 ** Grant and Revoke Functions
 ** These functions update the application's permission access. To grant permissions,
 ** the login function is used with permissions passed as part of the scope parameter.
 ** To revoke permissions, 'delete' is passed via FB.api's method parameter.
 *************************************************************************************/
function grantFriendsPermission () {
 FB.login(function(response) {
   getPermissionData(response);
   getFriendData(response);
 }, {scope: 'user_friends', auth_type: 'rerequest'});
}

function grantPublishPermission(response) {
  FB.login(function(response) {
  }, {scope: ['user_posts', 'publish_actions']});
}


function revokeFriendPermission() {
  FB.api(
    "/me/permissions/user_friends",
    "DELETE",
    function (response) {
      if (response && !response.error) {
        console.log("friend permission revoked");
        getPermissionData(response);
        getFriendData(response);
      }
    }
  );
}

/*************************************************************************************
** logOut()
** This logs the user out.
*************************************************************************************/
function logOut() {
  FB.logout(function(response) {
  });
}


/*************************************************************************************
** Getter functions
** These functions make HTTP GET requests to retrieve user data. They are called when
** either the status is updated or permissions is updated.
*************************************************************************************/
function getAuthResponseData(response) {
  for (var key in response.authResponse) {
    createAndAppendDiv(key, document.getElementById("authResponseData"), key + ": ", response.authResponse[key]);
  }
}

function getPublicProfileData(response) {
  FB.api('/me', {fields: publicProfile}, function(response) {
    //removeDiv('userData');
    for (var key in response) {
        createAndAppendDiv(key, document.getElementById("userData"), key + ": ", response[key])
    }
  })
}


function getPermissionData(response) {
  FB.api('/me/permissions', function(response) {
    //removeDiv('permissionData');
    for (var i = 0; i < response["data"].length; ++i) {
      if(response["data"][i]["status"] === "granted")
        permission = response["data"][i]["permission"];
        createAndAppendDiv(permission, document.getElementById("permissionData"), '', permission);
      }
  });
}


function getFriendData(response) {
  FB.api('/me/friends', function(response) {
    console.log("friend obj: " + JSON.stringify(response));
    //removeDiv('friendData');
    getFriendCount(response);
    getFriendList(response);
  })
}


function getFriendCount(response) {
  if (response.summary) {
    createAndAppendDiv("friendCount", document.getElementById("friendData"), "Friend Count: ", response.summary.total_count);
  }
}

function getFriendList(response) {
  for (var i in response.data) {
    createAndAppendDiv("friend_i", document.getElementById("friendData"), '', response.data[i].name);
  }
}

/*************************************************************************************
** Post function
** This function submits a status via a HTTP POST request. User must grant the
** application 'publish_actions' permission before sending the request. This
** functionality currently does not work on this application, as any action using the
** 'publish_actions' permission requires approval from Facebook.
*************************************************************************************/
function postStatus() {
  FB.api(
    "/me/feed",
    "POST",
    {  "access_token": accessToken, "message": document.getElementById("statusForm").value },
    function (response) {
      if (response && !response.error) {
        createAndAppendDiv("statusMessage", document.getElementById("statusSubmissionDiv"), 'Status Posted: ', document.getElementById("statusForm").value);
      }
      else {
        createAndAppendDiv("permissionDenied", document.getElementById("statusSubmissionDiv"), 'Permission Denied: ', 'This app cannot perform status updates until it is approved by Facebook');
      }
    }
  );
}
