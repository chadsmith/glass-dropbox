var util = require('util'),
  express = require('express'),
  googleapis = require('googleapis'),
  request = require('request'),
  settings = {
    server: {
      hostname: 'mktgdept.com',
      port: '5555'
    },
    google: {
      client_id: '000000000000.apps.googleusercontent.com',
      client_secret: 'bbbbbbbbbbbbbbbbbbbbbbbb'
    },
    dropbox: {
      app_key: 'aaaaaaaaaaaaaaa',
      app_secret: 'bbbbbbbbbbbbbbb'
    }
  },
  OAuth2Client = googleapis.OAuth2Client,
  oauth2Client = {},
  dropbox = require('dbox').app({ app_key: settings.dropbox.app_key, app_secret: settings.dropbox.app_secret }),
  session = {},
  mimeTypes = {
    'image/jpeg': '.jpg',
    'video/mp4': '.mp4'
  },
  app = express();

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res) {
  if(!oauth2Client.credentials) {
    oauth2Client = new OAuth2Client(settings.google.client_id, settings.google.client_secret, 'http://' + settings.server.hostname + ':' + settings.server.port + '/oauth2callback');
    res.redirect(oauth2Client.generateAuthUrl({
      access_type: 'offline',
      approval_prompt: 'force',
      scope: [
        'https://www.googleapis.com/auth/glass.timeline',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')
    }));
  }
  else if(!session.uid) {
    dropbox.requesttoken(function(status, tokens) {
      session = tokens;
      res.redirect(session.authorize_url + '&oauth_callback=' + encodeURIComponent('http://' + settings.server.hostname + ':' + settings.server.port + '/oauthcallback'));
    });
  }
  else {
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      client.mirror.withAuthClient(oauth2Client).newRequest('mirror.subscriptions.insert', null, {
        callbackUrl: 'https://mirrornotifications.appspot.com/forward?url=http://' + settings.server.hostname + ':' + settings.server.port + '/subcallback',
        collection: 'timeline',
        operation: [ 'INSERT' ]
      }).execute(function(err, result) {
        console.log('mirror.subscriptions.insert', util.inspect(result));
      });
      client.mirror.withAuthClient(oauth2Client).newRequest('mirror.contacts.insert', null, {
        displayName: 'Dropbox',
        id: 'dropbox',
        imageUrls: [ 'http://' + settings.server.hostname + ':' + settings.server.port + '/contact_image.png' ]
      }).execute(function(err, result) {
        console.log('mirror.contacts.insert', util.inspect(result));
      });
    });
    res.send(200);
  }
});

app.get('/oauthcallback', function(req, res) {
  dropbox.accesstoken(session, function(status, tokens) {
    session = tokens;
    dropbox = dropbox.client(session);
    res.redirect('/');
  });
});

app.get('/oauth2callback', function(req, res) {
  oauth2Client.getToken(req.query.code, function(err, tokens) {
    oauth2Client.credentials = tokens;
    res.redirect('/');
  });
});

app.post('/subcallback', function(req, res) {
  res.send(200);
  var id = req.body.itemId;
  console.log('/subcallback', util.inspect(req.body));
  if(req.body.operation == 'INSERT')
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      client.mirror.timeline.get({ id: id }).withAuthClient(oauth2Client).execute(function(err, result) {
        console.log('mirror.timeline.get', util.inspect(result));
        if(result.attachments && result.attachments.length && mimeTypes[result.attachments[0].contentType])
          request({
            method: 'GET',
            uri: result.attachments[0].contentUrl,
            headers: {
              'Authorization': [ oauth2Client.credentials.token_type, oauth2Client.credentials.access_token ].join(' ')
            },
            encoding: 'binary'
          }, function(err, req, body) {
            dropbox.put(id + mimeTypes[result.attachments[0].contentType], new Buffer(body, 'binary'), session, function(status, result) {
              console.log('dropbox.put', result);
            });
          });
      });
    });
});

app.listen(settings.server.port);