<?php
include('vendor/autoload.php');
include('./randos.php');
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']) && $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] == 'POST') {
        header('Access-Control-Allow-Origin: https://s3.us-east-2.amazonaws.com');
        header('Access-Control-Allow-Headers: X-Requested-With, content-type, access-control-allow-origin, access-control-allow-methods, access-control-allow-headers');
    }
    exit;
}

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Jwt\Grants\SyncGrant;
use Twilio\Jwt\Grants\ChatGrant;

// Load environment variables from .env, or environment if available
//$dotenv = new Dotenv\Dotenv(__DIR__);
//$dotenv->load();

// An identifier for your app - can be anything you'd like
$appName = 'TwilioStarterDemo';

// choose a random username for the connecting user
$identity = randomUsername();

// Create access token, which we will serialize and send to the client
$token = new AccessToken(
    getenv('TWILIO_ACCOUNT_SID'),
    getenv('TWILIO_API_KEY'),
    getenv('TWILIO_API_SECRET'),
    3600,
    $identity
);

// Grant access to Video
$grant = new VideoGrant();
$token->addGrant($grant);

// Grant access to Sync
$syncGrant = new SyncGrant();
if (empty(getenv('TWILIO_SYNC_SERVICE_SID'))) {
    $syncGrant->setServiceSid('default');
} else  {
    $syncGrant->setServiceSid(getenv('TWILIO_SYNC_SERVICE_SID'));
}  
$token->addGrant($syncGrant);

// Grant access to Chat
if (!empty(getenv('TWILIO_CHAT_SERVICE_SID'))) {
    $chatGrant = new ChatGrant();
    $chatGrant->setServiceSid(getenv('TWILIO_CHAT_SERVICE_SID'));
    $token->addGrant($chatGrant);
}


// return serialized token and the user's randomly generated ID
header('Content-type:application/json;charset=utf-8');
header('Access-Control-Allow-Origin: https://s3.us-east-2.amazonaws.com');
echo json_encode(array(
    'identity' => $identity,
    'token' => $token->toJWT(),
));
