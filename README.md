# Introduction

This how-to guide provides a specific step-by-step walkthrough of implementing the [Facebook Login](https://developers.facebook.com/docs/facebook-login) and [Graph](https://developers.facebook.com/docs/graph-api) APIs for their website. This guide is useful for those who have experience in Javascript, AJAX, and managing API calls. When you are done, you will be able to add a login and logout button on your application, update your application's permission access, get a user's list of friends, and post a status to a user's wall.

### What is Facebook's Login API?

The Login API provides developers an easy way to create a Facebook login button for the web or mobile application. 

### What is Facebook's Graph API?

The Graph API provides developers an easy way to read and write Facebook data via HTTP requests.

### Final Product

[Click here to see the final product.](http://people.oregonstate.edu/~heaneye/login.html)

[Click here to see the source code.]()


# Setup

**1. Create a Facebook Developer Account**

To use any of the Facebook APIs, you will need a [Facebook Developer](https://developers.facebook.com/) account. Creating one is easy. If you already have a Facebook account you can sign in with that, or create a new account.


**2. Create Application and Get the App ID**

Log in to your Facebook Developer dashboard. Click your profile image at the top right corner and select Add a New App. After you provide an app name, contact email, and verification code you will be taken to the app setup page.
 

**3. Implement Facebook SDK for Javascript**

Click Get Started next to the Login API. Select Web as the platform. You will be taken to a five step setup process. Provide the site URL and click next. 

You will then be provided with the Facebook SDK for Javascript code. 

	window.fbAsyncInit = function() {
		FB.init({
     			appId      : '415867265459204',
      			cookie     : true,
      			xfbml      : true,
      			version    : 'v2.8'
    		});
    
    		FB.AppEvents.logPageView();   
  	};

	(function(d, s, id){
     		var js, fjs = d.getElementsByTagName(s)[0];
     		if (d.getElementById(id)) {return;}
     		js = d.createElement(s); js.id = id;
     		js.src = "//connect.facebook.net/en_US/sdk.js";
     		fjs.parentNode.insertBefore(js, fjs);
   	}(document, 'script', 'facebook-jssdk'));`

There’s a lot going on here. The Facebook SDK handles a lot of the authentication details for us. Behind the scenes, the SDK performs an [OAuth](https://en.wikipedia.org/wiki/OAuth) authorization of the user. OAuth is a framework that allows third party applications, such as our test site, to obtain limited access to an HTTP services, such as the Facebook user database. The Facebook server will need an [access token](https://developers.facebook.com/docs/facebook-login/access-tokens/), or an id credential unique to the user, to grant our application permission to access the user data. Access tokens expire, which require our application to request again. Again, these details are handled by the Facebook SDK for us, but it’s crucial to have an understanding of how it works when we encounter debugging issues down the road.

The **window.fbAsyncInit** method initializes the Facebook SDK asynchronously. Within this method we will place other asynchronous functions to respond to incoming HTTP requests. The method **FB.init()** initializes the Facebook SDK while the inscrutible **(function(d, s, id)** function loads the SDK. Make sure that the appID parameter has the application ID generated from your account. Setting cookie to true will set a cookie on your domain, which will allow for easy user logins. These are the default settings, so you won’t have to change anything.


# Implementing the Facebook Login API


**1. Adding a Login Button**

There are two ways to implement a login button. We can use Facebook’s pre-built Continue button, seen below. Or we can make our own button via HTML and an event handler.

Button says “Continue with Facebook” if user is not currently logged into Facebook on the same browser.
 
Button says “Continue with as [user_name]” and displays their profile picture if the user is currently logged into Facebook on the same browser.
 
**a. Adding a "Continue as " button**

Once again, Facebook makes things easy for you. They have a (button generator)[https://developers.facebook.com/docs/facebook-login/web/login-button] where you can input the width, photom number, size, text, and more, then generates the HTML code for you. Here is the code I used:

	<div
		class="fb-login-button"
		data-max-rows="1"
		data-size="large"
		data-button-type="continue_with"
		data-show-faces="false"
		data-auto-logout-link="false"
		data-use-continue-as="true"
		scope="public_profile">
	</div>

**b. Adding a HTML Login Button**
	
Creating your own HTML login button is simple too. Simply create an HTML button and set the onclick attribute to your event handler function.
	
	<button onclick="login()">Log in</button>

	In Javascript, call the FB.login method. 

	function login(response) {
  		FB.login(function(response) {
  		}
	}
	
When the user clicks the button will generate the login process. There are three workflows:

1.	User is logged into Facebook on the browser and has logged into the app before. User will be taken to the site directly upon clicking login.

2.	User is logged into Facebook but has never logged into the app before. User must grant the app permission to have access to his or her data. This permission list must be shown to the user.

3.	User is not logged into Facebook. User must provide email and password. 

 
Facebook remembers if a user’s application authorizations. So if they have logged into the app before, they will be immediately logged in. If not, they will have to grant access.
	
**2. Checking the Login Status**

To make our site dynamic, we will need to check if the user is logged in or not. We do this via the method FB.getLoginStatus(). 
	
	FB.getLoginStatus(function(response) {
    		if (response.status === 'connected') {
      			// user is connected
    		}
    		else if (response.status === 'not_authorized') {
      			// user is logged into facebook but has not authorized the app
   		 }
    		else {
      			// user is logged out of facebook
    		}
	});
	
We pass the method a function parameter. It will return a response JSON object. The response object is structured as below:
	
**status** returns the login status, which can be one of the three:
		
**connected:** the person is logged into Facebook and has logged into your app. If your browser has cookies turned on, you will be logged into your app
**not_authorized:** the person is logged into Facebook, but has not logged into your app. You will be asked to 
**unknown:** the person is not logged into Facebook, thus you don’t know if they’ve logged into your app before.

**authResponse** is included if the status is connected and is made up of the following:

**accessToken:** contains an access token for the person using the app.
**expiresIn:** indicates the UNIX time when the token expires and needs to be renewed.
**signedRequest:** a signed parameter that contains information about the person using the app.
**userID:** the ID of the person using the app. 

It’s a good idea to print the JSON object to console or to your page to confirm you are getting the response. In my demo app, I parsed the object and placed it on the page for easy access:
 
**3. Making the Site Asynchronous**

So far we have added the login button and verified user login with simple print statements. However, you may have noticed that your page does not update until after a page refresh. This is because the FB.getLoginStatus is synchronous; it will only get called once when the page loads.

To fix this, we need to perform asynchronous calls to the API to check for status changes. The Facebook API performs asynchronous calls via the FB.Event.subscribe() method. It takes two parameters: the event to listen to and a callback function.

		FB.Event.subscribe('auth.statusChange', statusChange);
		
The FB.Event.subscribe() method needs to be called within the window.fbAsyncInit() method. Create a new function called statusChange(response) which will call the FB.getLoginStatus() method. Now the page will update as login status updates. 

**4. Adding a Logout Button**
Adding a logout button is straightforward. Simply use the FB.logout() method. 

		function logOut() {
  			FB.logout(function(response) {
 			});
		}

**5. Managing Permissions**
	
At this point in the how-to guide, it is necessary to take step back and discuss how Facebook manages [permissions](https://developers.facebook.com/docs/facebook-login/permissions/).

Permissions allow an application read and write priviledges for an entity. As of May 2017, Facebook offers 45 granular permissions, all of which are listed in their reference page. When a user logs into their account, they authorize a set of permissions. These permissions must be approved by the user beforehand. The default permission is public_profile, which is granted during every login. It includes the following data:

•	id
•	cover
•	name
•	first_name
•	last_name
•	age_range
•	link
•	gender
•	locale
•	picture
•	timezone
•	updated_time
•	verified

The public_profile, email, and user_friends are all available to developers to use at any time. To use any other permissions, however, requires submitting the application to Facebook for review. Please see their [review process](https://developers.facebook.com/docs/apps/review) for more information.

**Requesting and Granting permsissions**

It is common for applications to only request the public_profile permission upon login, but request further authorization to allow the user access to deeper functionality. In order to request granular permissions, we use the the FB.login method and pass the permission name via the scope parameter. 

		function grantFriendsPermission () {
 			FB.login(function(response) {
 			}, {scope: 'user_friends'});
		}

**Revoking Permissions**
		
It is also important to allow users to revoke an applications access to their data at any time. To do so, we use the **FB.api** method. If the following code looks alien, don't worry, this is Graph API method. We will discuss the details of this method in the section below.

		function revokeFriendPermission() {
  			FB.api(
    				"/me/permissions/user_friends",
    				"DELETE",
    				function (response) {
      					if (response && !response.error) {
        					console.log("friend permission revoked");
					}
    				}
  			);
		}

The important thing to know now is that we pass the permission name via [user_id]/permissions/[permission_name] as the first argument and DELETE as the second argument.


**Requesting and Granting Permissions (revisited)**

To improve user experience, Facebook discourages applications from re-requesting permissions after they have been revoked. They don't want to sponsor applications that spam their users into giving away data permissions. However, we can do this by passing the argument auth_type: 'rerequest', as seen below.

		function grantFriendsPermission () {
 			FB.login(function(response) {
 			}, {scope: 'user_friends', auth_type: 'rerequest'});
		}




# Implementing the Graph API


**1. The Graph API Structure**

Facebook's Graph API is structured like a mathematical graph with nodes and edges. Each node represents an entity, such as a user, a photo, a comment, or a page, while each edge represents the connection between entities, such as a user's photo or a photo's comment. Finally, their are fields, which is data related to these entities.

To reference a graph object, follow the syntax below:
	
	/[node_id]/[edge_id]/[field_id]

For example, if we want to reference the current user's friends, we write
	
	/me/friends

We will use this syntax repeatedly within this section, so it's a good idea to get familiar with it. You can play around with it more using the [Graph API Explorer](https://developers.facebook.com/tools/explorer).


**2. Making Calls with the FB.api() Method**

The FB.api() lets you make calls to the Graph API. It takes the four arguments:

**path:** The graph endpoint you want to call (e.g. 'me/friends').
**method:** The HTTP method. It accepts the following: 'GET', 'POST', 'DELETE'. The default is 'GET', which we will be using for most of this guide.
**params:** this takes an object of parameters that can be passed to the API call. This is useful for more advanced functionality and passing access tokens. We will discuss this in detail later.
**callback:** This takes a callback function that will be triggered whenever the API returns a response. The response object contains the API result.


**3. Reading User Data via a GET Request**

Let's use the FB.api() method to get the current user's public profile data. To do this, type the following:

	function getPublicProfileData(response) {
  		FB.api('/me', {fields: publicProfile}, function(response) {
    			console.log(response);
  		})
	}
 

In your console you should see the public profile data.


**4. Writing User Data via a POST Request**

Let's use the FB.api() to post a status to the current user's wall from within our application. This will require us to get the publish_actions permission from the user. This guide will walk you through how to create the POST request, but since the publish_actions permisssion requires approval by Facebook to use, we will not be able to verify the code. The application will state the publish_actions permission is 'granted', but the Facebook API will prevent any actions related to it.

**a. Get publish_actions permission**

Get the publish_actions permission from the user. This can be done via the FB.login method.

	function grantPublishPermission(response) {
  		FB.login(function(response) {
  		}, {scope:'publish_actions'});
	}
	
**b. Send POST Request**

Use the FB.api() method to send a POST request. For the first parameter we will pass **me/feed**, which is the status node. In the second parameter we will pass **POST** as the method. For the third parameter we will pass the access token (which must be retrieved from response.authResponse.access_token) and the message. Finally we will pass the callback function to handle the response.

	function postStatus() {
  		FB.api(
    		"/me/feed",
    		"POST",
    		{  "access_token": accessToken, "message": "hello world" },
    		function (response) {
      			if (response && !response.error) {
        			console.log("status posted successfully");
      			}
      			else {
        			console.log("error: " + JSON.stringify(response.error));
        		}
    		}
  		);
	}

Again, using this functionality will require approval by Facebook to work.
