/* Havoc Websocket rich-text UI customizations. Included when &havoc is set in the URL */

if (param('havoc')) {
	
	Config.port = Config.port.length ? Config.port : 6001;
	Config.proxy = 'ws://' + Config.host + ':' + Config.port + '/';
	Config.fbAppId = Config.fbAppId || param('fb'); 
	Config.bare = 1;
	Config.nocore = 1;
	Config.base64 = 1;
	Config.debug = 1;
	Config.notrack = 1;
	Config.notriggers = 1;
	Config.nomacros = 1;
	
	Event.listen('socket_open', function() {
		Config.Socket.write('{ portal: 1 }');
	});
	
	j('body').css({ 
	    fontFamily: '"Open Sans", "DejaVu Sans", "Symbola", "Lucida Console", "Courier New"',
	    fontSize: 15
	});
}

if (param('havoc') && !param('gui')) {

    Config.ScrollView = new ScrollView();
    
    Config.MistyBars = new MistyBars({ 
        
        process: function(d) { 
            
            try {
                
                var key = d.match(/([^ ]+?) /)[1];
                var value = d.match(/[^ ]+? (.*)/)[1];
                
                if (!key.start('ch.points')) 
                    return d; 
                
                var p = eval('(' + value + ')'); 
                
                if (p.points) 
                    p = p.points; 
                
                cm = { 
                    maxhp: p.maxhit || cm.maxhp, 
                    maxmana: p.maxmana || cm.maxmana, 
                    maxmoves: p.maxstamina || cm.maxmoves 
                };
                
                cv = { 
                    hp: p.hit, 
                    mana: p.mana, 
                    moves: p.stamina 
                };
                
                cs = { /* level: 210, enl: 3000, tnl: 1000, state: 3, pos: "Standing", */ 
                    tnl: -1, 
                    exp: p.exp || "N/A", 
                    enemy: p.enemy || "N/A", 
                    enemypct: p.enemypct || 0 
                };
                
                redraw(); 
                log('MistyBars override: '+stringify(p)); 
            } 
            catch(err) { 
                log('MistyBars override gmcp parse error: '+err); 
            }
                
            return d; 
        }
    });
	
    if (!param('gui'))
	    Event.listen('socket_close', function() {
			new Modal({
				title: 'Server Disconnected',
				text: 'Lost server connection. This is normal if you\'re navigating away. If not, usually, this means a server boot / update. Please reload the page to make sure you have the latest app code.<br><br>',
				backdrop: 'static',
				closeable: 0,
				buttons: [{
				   text: 'Reload',
				   click: function() { window.onbeforeunload = function() {}; window.location.reload(); }
				}]
			});
		});
	
    if (!param('gui'))
	    j(document).ready(function() {
	    	Config.Toolbar = new Toolbar();
	    	Event.listen('window_open', Config.Toolbar.update);
	    	Event.listen('window_close', Config.Toolbar.update);
	    	Event.listen('window_front', Config.Toolbar.front);
	    });
}

var Facebook = function(a, b) {

	//console.log(Config);
	
	if (a == 'init') {
		
		if (!Config.fbAppId)
			return;
			
		log('Havoc: Facebook app id detected: ' + Config.fbAppId);
		
		window.fbAsyncInit = function() {
		
			FB.init({
				appId      : Config.fbAppId,
				xfbml      : true,
				version    : 'v2.2'
			});
		
			Facebook('checkState');
		};

		( function(d, s, id){
			 var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) {return;} js = d.createElement(s); js.id = id;
			 js.src = "//connect.facebook.net/en_US/sdk.js"; fjs.parentNode.insertBefore(js, fjs);
		} (document, 'script', 'facebook-jssdk'));

		j('body').on('show.bs.modal', function() {
			if (j('.modal.login-prompt').length)
				j('.modal-footer').prepend('\
					<div class="left" style="opacity: 0.7; margin-right: 6px">\
						<img src="/aaralon/images/FacebookButton.png" class="tip pointer" title="Log in with your Facebook account." onclick="Facebook(\'login\');">\
					</div>');
		});

		return;
	}

	if (a == 'login')
		return FB.login(function(resp) { Facebook('statusChange', resp); }, { scope: 'public_profile,email' });
	
	if (a == 'checkState')
		return FB.getLoginStatus(function(resp) { Facebook('statusChange', resp); });
	
	if (a == 'statusChange') {
		console.log(b);
		if (b.status == "connected") {
			
			FB.api("/me", function (resp) {
				
				if (!resp || resp.error)
					return;
				
				console.log(resp);
				
				if (window.info)
					info.fb = resp;
				
				Config.Socket.write(stringify({ fbid: resp.id, email: resp.email }));
			});
		}
	}
}

Facebook('init');
	